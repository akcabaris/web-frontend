'use client';
import WarningModal from "@/components/WarningModal";
import { handleError } from "@/helpers/ErrorHandler";
import { validateTickets } from "@/helpers/TicketValidation";
import bookedSeats from "@/services/Seat";
import { useState, useEffect } from "react";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { BsChevronDown } from "react-icons/bs";
import { BsChevronRight } from "react-icons/bs";
import Image from 'next/image';

type SeatStatus = 'available' | 'selected' | 'booked';

interface Seat {
  id: number;
  status: SeatStatus;
  bookedPerson: string;
}

export default function Home() {
  const [seats, setSeats] = useState<Seat[]>([]);

  const [tickets, setTickets] = useState<Ticket>({ price: 0, seatNumbers: [], Passengers: [] });
  const [showDetails, setShowDetails] = useState<boolean[]>([]);
  const [isFirstSelectDone, setIsFirstSelectDone] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);

  const currentDate = new Date();
  const maxDateForInput = currentDate.toISOString().split('T')[0];
  const minDateForInput = currentDate.setFullYear(currentDate.getFullYear() + 150)

  useEffect(() => {
    const initialSeats: Seat[] = Array.from({ length: 40 }, (_, index) => ({
      id: index + 1,
      status: 'available' as SeatStatus,
      bookedPerson: '',
    }));
    setSeats(initialSeats);

    getUsersAndUpdateSeats();
  }, []);

  // local'de seçilmiş koltukları ekleyerek ticket bilgilerini tuttuğum useState hook'una atıyorum
  const getUsersAndUpdateSeats = async () => {
    //dolu koltuk bilgilerinin çekilmesi
    try {
      const data: User[] = await bookedSeats();
      setSeats((prevSeats) =>
        prevSeats.map((seat) => {
          const matchedUser = data.find((user) => user.id === seat.id);
          if (matchedUser) {
            return { ...seat, status: 'booked', bookedPerson: matchedUser.name };
          }
          return seat;
        })
      );
    } catch (err) {
      handleError(err);
    }

    // localStorage'den dolu koltuk bilgilerini biletleri tutan state'e atanması
    const storedTickets = localStorage.getItem('tickets');
    if (storedTickets) {
      const parsedTickets = JSON.parse(storedTickets);

      const updatedTickets = { ...parsedTickets, price: parsedTickets.seatNumbers.length * 1000, };
      setTickets(updatedTickets);

      setSeats((prevSeats) =>
        prevSeats.map((seat) => {
          if (updatedTickets.seatNumbers.includes(seat.id) && seat.status !== "booked") {
            return { ...seat, status: 'selected' };
          } else if (updatedTickets.seatNumbers.includes(seat.id) && seat.status === "booked") {
            localStorage.removeItem('tickets');
          }
          return seat;
        })
      );
    }
  };


  // ilk bilet alındıktan sonra kullanıcının herhangi bir işlem yapıp yapılmadığı 30 saniye izlenmekte ve ona göre uyarı modal'ı açılmakta
  useEffect(() => {
    if (!isFirstSelectDone) return;

    const timer = setTimeout(() => {
      setShowModal(true);
    }, 30000);

    const handleClick = () => {
      clearTimeout(timer);
    };

    document.addEventListener('click', handleClick);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleClick);
    };
  }, [isFirstSelectDone]);

  //koltuk seçimi
  const handleSeatClick = (id: number) => {
    const seat = seats.find((seat) => seat.id === id);
    if (!seat) return;

    // dolu koltuklar seçilemez
    if (seat.status === "booked") {
      toast.warning("Bu koltuk zaten satılmış, lütfen başka koltuk seçiniz.");
      return;
    }

    const selectedSeatsCount = seats.filter((seat) => seat.status === "selected").length;

    // en fazla 3 koltuk seçilebilir
    if (selectedSeatsCount === 3 && seat.status !== "selected") {
      toast.warning("En fazla 3 koltuk seçebilirsiniz.");
      return;
    }

    // ilk koltuk seçildikten sonra uyarı modalı 30 saniye sonra açılacak. buradan ilk tetikleme işlemi yapılıyor.
    if (selectedSeatsCount === 0 && seat.status === "available") {
      setIsFirstSelectDone(true);
    }

    setSeats((prevSeats) =>
      prevSeats.map((prevSeat) => {
        if (prevSeat.id === id) {
          if (prevSeat.status === "available" && selectedSeatsCount < 3) {
            const newSeatNumbers = [...tickets.seatNumbers, id];
            const updatedTickets = {
              ...tickets,
              seatNumbers: newSeatNumbers,
              price: (selectedSeatsCount + 1) * 1000,
            };
            setTickets(updatedTickets);
            handleStoreLocal(updatedTickets);
            return { ...prevSeat, status: "selected" };
          }
          else if (prevSeat.status === "selected") {
            const newSeatNumbers = tickets.seatNumbers.filter((seatID) => seatID !== id);
            const updatedTickets = {
              ...tickets,
              seatNumbers: newSeatNumbers,
              price: (selectedSeatsCount - 1) * 1000,
            };
            setTickets(updatedTickets);
            if (newSeatNumbers.length === 0) {
              localStorage.removeItem("tickets");
            } else {
              handleStoreLocal(updatedTickets);
            }
            return { ...prevSeat, status: "available" };
          }
        }
        return prevSeat;
      })
    );
  };

  //yolcu bilgilerinin tutulması
  const handlePassengerChange = (index: number, field: keyof Passenger, value: string | Date) => {
    const updatedPassengers = [...tickets.Passengers];
    updatedPassengers[index] = { ...updatedPassengers[index], [field]: value };

    const updatedTickets = { ...tickets, Passengers: updatedPassengers };
    setTickets(updatedTickets);
    handleStoreLocal(updatedTickets);
  };

  const handleStoreLocal = (updatedTickets: typeof tickets) => {
    localStorage.setItem("tickets", JSON.stringify(updatedTickets));
  };

  // uyarı modal'ının açılması, ilk koltuk seçimi yapıldıktan sonra çağırılıyor
  const handleWarningModalCloseOrApprove = () => {
    setShowModal(false);
  };

  // uyarı modal açıldıktan sonra işlem yapılmazsa seçilen koltuklar temizleniyor ve sayfa yenileniyor
  const handleOnRestart = () => {
    console.log("Restart işlemi tetiklendi.");
    localStorage.removeItem('tickets');
    window.location.reload();
  };

  // yolcu bilgileri girildiği form inputlarının açılması / kapanması
  const toggleDetails = (index: number) => {
    setShowDetails((prevShowDetails) => {
      const newShowDetails = [...prevShowDetails];
      newShowDetails[index] = !newShowDetails[index];
      return newShowDetails;
    });
  };

  // formun yollanması
  const handleSubmit = async (event: React.FormEvent, tickets: Ticket) => {
    event.preventDefault();

    // istenilen validation kuralları bu task için hmtl attribute'ları ile karşılanabilmekte,
    // ekstra olarak helper sınıfından bir validation ile boş olup olmadıklarını kontrol ediyorum
    // daha ilerisini yazmıyorum ama yazacak olsaydım Yup vb. hazır kütüphane kullanabilirdim
    // veya manuel validation kuralları yazarak, error list şeklinde hataları useState hook'unda tutar
    // ve input tag'larının altına  {errors.nameErrors && <p>{errors.nameError}</p>} (örneğin) şeklinde yazardım.
    if (!validateTickets(tickets)) {
      return;
    }
    if (true) {

      // POST Request yolladığımı varsayarak if içinde response status değeri 200 veya uygun döndürülmüş mü kontrol ettiğimi varsayarak if içine true yazıyorum 
      try {
        localStorage.removeItem('tickets');
        toast.success("Uçak Bileti alma işlemi başarılı.");

        setSeats((prevSeats) =>
          prevSeats.map((seat) => ({
            ...seat,
            status: "available",
            bookedPerson: "",
          }))
        );
        setTickets({ price: 0, seatNumbers: [], Passengers: [] });
        await getUsersAndUpdateSeats()
        console.log(tickets);
      }
      catch (err) {
        handleError(err);
      }
    }
  };


  return (
    <div className="flex w-full justify-center min-h-screen bg-custom-light-gray min-w-full top-24 pt-10">
      <div className="flex min-w-max flex-col top-10">
        <div className="flex flex-col items-center">
          <div className="">
            <Image src="/front.png" alt="Front" width={570} height={70} className="" />
          </div>
          <div className="flex flex-row">
            <div>
              <Image src="/left.png" alt="Left" width={250} height={382} />
            </div>
            <div className="w-[67px] h-[382px] flex" >
              <div className="flex flex-wrap  w-64 h-64 space-y-5">
                <span></span>
                {seats.map((seat) => (
                  <div key={seat.id} className={`flex justify-center w-1/5  ${seat.id % 2 === 0 && seat.id % 4 !== 0 ? "mr-2" : ""}`}>
                    <button
                      onClick={() => handleSeatClick(seat.id)}
                      title={seat.status === "booked" ? `${seat.bookedPerson}` : ""}
                      className={`text-black border border-custom-gray rounded-sm w-2 h-3
                          ${seat.status === "selected"
                          ? "bg-custom-yellow"
                          : seat.status === "available"
                            ? "bg-custom-light-gray"
                            : "bg-custom-booked-gray"}
                            ${seat.id === 16 ? "mb-10" : ""}
                            `}
                    />
                  </div>
                ))}
              </div>


            </div>
            <div>
              <Image src="/right.png" alt="Right" width={252} height={382} />
            </div>
          </div>
          <div className="">
            <Image src="/back.png" alt="Back" width={570} height={124} />
          </div>
        </div>
        <div>
          <div className="flex justify-center pt-10 space-x-2 ">
            <div className="items-center justify-center flex flex-col">Dolu
              <div className="w-4 h-6 rounded-md bg-custom-booked-gray border border-ticket-border border-custom-ticket"></div>
            </div>
            <div className="items-center justify-center flex flex-col">Seçili
              <div className="w-4 h-6 rounded-md bg-custom-yellow border border-ticket-border border-custom-ticket"></div>
            </div>
            <div className="items-center justify-center flex flex-col">Boş
              <div className="w-4 h-6 rounded-md border border-ticket-border border-custom-ticket"></div>
            </div>
          </div>
        </div>


      </div>


      {
        tickets.seatNumbers.length == 0 ? (
          <div> <h2>Lütfen bilet seçiniz.</h2> </div>
        ) :
          <div className=" flex w-2/5 flex-col items-center p-2 m-2 ">
            <form onSubmit={(e) => handleSubmit(e, tickets)} className="flex flex-col w-2/3 items-center text-sm">
              {seats
                .filter((seat) => seat.status === "selected")
                .map((seat, index) => (
                  <div key={seat.id} className="rounded-md p-2 w-full m-2">
                    <label
                      onClick={() => toggleDetails(index)}
                      className="flex justify-between items-center cursor-pointer font-medium mb-2 text-lg border w-full p-3 bg-custom-gray-sec"
                    >
                      {index + 1}. Yolcu
                      {showDetails[index] ? <BsChevronDown className="text-white size-8" /> : <BsChevronRight className="text-white size-8" />}
                    </label>
                    {showDetails[index] && (
                      <div className="grid grid-cols-2 gap-4 ">
                        <div>
                          <label htmlFor="name" className="block font-sans ">İsim</label>
                          <input
                            id="name"
                            type="text"
                            required
                            value={tickets?.Passengers[index]?.firstName || ""}
                            onChange={(e) => handlePassengerChange(index, "firstName", e.target.value)}
                            className="w-full border border-gray-300 px-2 py-1 rounded-sm focus:outline-none focus:ring focus:ring-blue-300 bg-custom-light-gray"
                          />
                        </div>
                        <div>
                          <label htmlFor="lastName" className="block font-sans">Soyisim</label>
                          <input
                            id="lastName"
                            type="text"
                            required
                            value={tickets?.Passengers[index]?.lastName || ""}
                            onChange={(e) => handlePassengerChange(index, "lastName", e.target.value)}
                            className="w-full border border-gray-300 px-2 py-1 rounded-sm focus:outline-none focus:ring focus:ring-blue-300 bg-custom-light-gray"
                          />
                        </div>
                        <div>
                          <label htmlFor="phoneNumber" className="block font-sans">Telefon</label>
                          <input
                            id="phoneNumber"
                            type="tel"
                            maxLength={10}
                            placeholder="format > 5559992222"
                            pattern="[0-9]{10}"
                            required
                            value={tickets?.Passengers[index]?.phoneNumber || ""}
                            onChange={(e) => handlePassengerChange(index, "phoneNumber", e.target.value)}
                            className="w-full border border-gray-300 px-2 py-1 rounded-sm focus:outline-none focus:ring focus:ring-blue-300 bg-custom-light-gray"
                          />
                        </div>
                        <div>
                          <label htmlFor="email" className="block font-sans">E-Posta</label>
                          <input
                            id="email"
                            type="email"
                            required
                            value={tickets?.Passengers[index]?.email || ""}
                            onChange={(e) => handlePassengerChange(index, "email", e.target.value)}
                            className="w-full border border-gray-300 px-2 py-1 rounded-sm focus:outline-none focus:ring focus:ring-blue-300 bg-custom-light-gray"
                          />
                        </div>
                        <div>
                          <label htmlFor="gender" className="block font-sans">Cinsiyet</label>
                          <select
                            id="gender"
                            required
                            value={tickets?.Passengers[index]?.gender || ""}
                            onChange={(e) => handlePassengerChange(index, "gender", e.target.value)}
                            className="w-full border border-gray-300 px-2 py-1 rounded-sm focus:outline-none focus:ring focus:ring-blue-300 bg-custom-light-gray"
                          >
                            <option value="">Seçiniz</option>
                            <option value="Male">Erkek</option>
                            <option value="Female">Kadın</option>
                          </select>
                        </div>
                        <div>
                          <label htmlFor="birthDate" className="block font-sans">Doğum Tarihi</label>
                          <input
                            id="birthDate"
                            type="date"
                            required
                            min={minDateForInput}
                            max={maxDateForInput}
                            placeholder="Birth Date"
                            value={
                              tickets.Passengers[index]?.birthDate instanceof Date && !isNaN(tickets.Passengers[index]?.birthDate.getTime())
                                ? tickets.Passengers[index]?.birthDate.toISOString().split('T')[0]
                                : ""
                            }
                            onChange={(e) => {
                              const updatedDate = new Date(e.target.value);
                              handlePassengerChange(index, "birthDate", updatedDate);
                            }}
                            className="w-full border border-gray-300 px-2 py-1 rounded-sm focus:outline-none focus:ring focus:ring-blue-300 bg-custom-light-gray"
                          />
                        </div>
                      </div>
                    )}

                  </div>
                ))}
              <button
                type="submit"
                className="flex w-full rounded-sm justify-center items-center text-2xl mt-20 py-4 mx-auto bg-custom-gray-sec"
              >
                İşlemleri Tamamla
              </button>

            </form>
            {
              tickets.seatNumbers.length >= 1 ?
                <div className="flex border justify-between mt-10 bg-custom-gray w-4/5 min-w-max">
                  <div className="flex justify-around px-4 my-2 ml-10 items-center space-x-2">
                    {tickets.seatNumbers.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-center min-w-7 min-h-10 font-light rounded-md bg-custom-yellow border border-custom-ticket"
                      >
                        {item}
                      </div>
                    ))}
                  </div>


                  <div className="flex-col m-4 p-3 justify-items-end">
                    <div className="flex items-end justify-end text-gray-800 text-sm">
                      {tickets.seatNumbers.length}x
                      <div className="w-4 h-6 rounded-md bg-custom-yellow border border-ticket-border border-custom-ticket"></div>
                    </div>
                    <p>{new Intl.NumberFormat('tr-TR').format(tickets.price)} TL</p>

                  </div>
                </div>
                : <> </>
            }
          </div>
      }

      {
        showModal && (
          <WarningModal onRestart={handleOnRestart} onCloseOrApprove={handleWarningModalCloseOrApprove} />
        )}
    </div>
  );
}
