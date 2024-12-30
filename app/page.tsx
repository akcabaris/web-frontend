'use client';
import WarningModal from "@/components/WarningModal";
import { handleError } from "@/helpers/ErrorHandler";
import { validateTickets } from "@/helpers/TicketValidation";
import bookedSeats from "@/services/Seat";
import { useState, useEffect } from "react";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

type SeatStatus = 'available' | 'selected' | 'booked';

interface Seat {
  id: number;
  status: SeatStatus;
  row: number;
  column: number;
  bookedPerson: string;
}

export default function Home() {
  const [seats, setSeats] = useState<Seat[]>([
    { id: 1, status: 'booked', row: 1, column: 1, bookedPerson: "" },
    { id: 2, status: 'available', row: 1, column: 2, bookedPerson: "" },
    { id: 3, status: 'available', row: 1, column: 3, bookedPerson: "" },
    { id: 4, status: 'available', row: 1, column: 4, bookedPerson: "" },
    { id: 5, status: 'available', row: 2, column: 1, bookedPerson: "" },
    { id: 6, status: 'available', row: 2, column: 2, bookedPerson: "" },
    { id: 7, status: 'available', row: 2, column: 3, bookedPerson: "" },
    { id: 8, status: 'available', row: 2, column: 4, bookedPerson: "" },
    { id: 9, status: 'available', row: 3, column: 1, bookedPerson: "" },
    { id: 10, status: 'available', row: 3, column: 2, bookedPerson: "" },
    { id: 11, status: 'available', row: 3, column: 3, bookedPerson: "" },
    { id: 12, status: 'available', row: 3, column: 4, bookedPerson: "" },
    { id: 13, status: 'available', row: 4, column: 1, bookedPerson: "" },
    { id: 14, status: 'available', row: 4, column: 2, bookedPerson: "" },
    { id: 15, status: 'available', row: 4, column: 3, bookedPerson: "" },
    { id: 16, status: 'available', row: 4, column: 4, bookedPerson: "" },
  ]);

  const [tickets, setTickets] = useState<Ticket>({ price:0, seatNumbers: [], Passengers: [] });
  const [showDetails, setShowDetails] = useState<boolean[]>([]);
  const [isFirstSelectDone, setIsFirstSelectDone] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);

  const currentDate = new Date();
  const maxDateForInput = currentDate.toISOString().split('T')[0];
  const minDateForInput = currentDate.setFullYear(currentDate.getFullYear() + 150)

  // başlangıçta alınmış koltuk bilgilerini çekiyorum ve seçilmiş koltukları "booked" statüsüne getiriyorum
  // local'de seçilmiş koltukları ekleyerek ticket bilgilerini tuttuğum useState hook'una atıyorum
  useEffect(() => {

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

        const updatedTickets = {...parsedTickets, price: parsedTickets.seatNumbers.length * 1000,};
        setTickets(updatedTickets);
        
        setSeats((prevSeats) =>
          prevSeats.map((seat) => {
            if (updatedTickets.seatNumbers.includes(seat.id)) {
              return { ...seat, status: 'selected' };
            }
            return seat;
          })
        );
      }
    };
  
    getUsersAndUpdateSeats();
  }, []);


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
      toast.warning("En fazla 3 bilet seçebilirsiniz.");
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
  const handleSubmit = (event: React.FormEvent, tickets: Ticket) => {
    event.preventDefault();

    // istenilen validation kuralları bu task için hmtl attribute'ları ile karşılanabilmekte,
    // ekstra olarak helper sınıfından bir validation ile boş olup olmadıklarını kontrol ediyorum
    // daha ilerisini yazmıyorum ama yazacak olsaydım Yup vb. hazır kütüphane kullanabilirdim
        // veya manuel validation kuralları yazarak, error list şeklinde hataları useState hook'unda tutar
            // ve input tag'larının altına  {errors.nameErrors && <p>{errors.nameError}</p>} (örneğin) şeklinde yazardım.
    if (!validateTickets(tickets)) {
      return;
    }

    // POST Request yolladığımı varsayarak if içinde response status değeri 200 veya uygun döndürülmüş mü kontrol ettiğimi varsayarak if içine true yazıyorum 
    if(true){
      toast.success("Uçak Bileti alma işlemi başarılı.");
      console.log(tickets);
    }
  };


  return (
    <div className="w-full flex">
      <div className="w-1/4 flex-col">
        <h1>Welcome to the Flight Booking System</h1>
          <div className="border">
            {seats.map((seat) => (
              <button
                key={seat.id}
                onClick={() => handleSeatClick(seat.id)}
                style={{
                  padding: "10px",
                  margin: "5px",
                  backgroundColor:
                    seat.status === "available"
                      ? "lightgray"
                      : seat.status === "selected"
                      ? "yellow"
                      : "gray",
                  color: "white"
                  
                }}
                title={
                  seat.status === "booked"
                    ? `${seat.bookedPerson}`
                    : ""
                }
              >
                {seat.id}
              </button>
            ))}
          </div>
      </div>

      <div className="flex-col">
        <form onSubmit={(e) => handleSubmit(e,tickets)}>
        {seats
          .filter((seat) => seat.status === "selected")
          .map((seat, index) => (
            <div key={seat.id} className="border rounded-md p-2">
              <label onClick={() => toggleDetails(index)} style={{ cursor: "pointer", fontWeight: "bold" }}>
                Passenger {index + 1}:
              </label>
              {showDetails[index] && (
                <div>
                  <input
                    type="text"
                    placeholder="First Name"
                    required
                    value={tickets?.Passengers[index]?.firstName || ""}
                    onChange={(e) => handlePassengerChange(index, "firstName", e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Last Name"
                    required
                    value={tickets?.Passengers[index]?.lastName || ""}
                    onChange={(e) => handlePassengerChange(index, "lastName", e.target.value)}
                  />
                  <input
                    type="tel"
                    placeholder="555-111-1111"
                    pattern="[0-9]{3}-[0-9]{3}-[0-9]{4}"
                    required
                    value={tickets?.Passengers[index]?.phoneNumber || ""}
                    onChange={(e) => handlePassengerChange(index, "phoneNumber", e.target.value)}
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    required
                    value={tickets?.Passengers[index]?.email || ""}
                    onChange={(e) => handlePassengerChange(index, "email", e.target.value)}
                  />
                  <select
                    required
                    value={tickets?.Passengers[index]?.gender || ""}
                    onChange={(e) => handlePassengerChange(index, "gender", e.target.value)}
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                  <input
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
                  />

                </div>
              )}
              
            </div>
          ))}
        <button type="submit" className="border bg-slate-500">
            Submit
        </button>
        <p>Price: {tickets.price}</p>
        </form>
      </div>
      {
        showModal && (
        <WarningModal onRestart={handleOnRestart} onCloseOrApprove={handleWarningModalCloseOrApprove} />
      )}
    </div>
  );
}
