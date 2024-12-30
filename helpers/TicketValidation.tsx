import { toast } from "react-toastify";

export const validateTickets = (tickets: Ticket): boolean => {
    if (!tickets.Passengers || tickets.Passengers.length === 0) {
      toast.error("Lütfen yolcu bilgilerini doldurunuz.");
      return false;
    }
  
    for (const passenger of tickets.Passengers) {
      const { firstName, lastName, phoneNumber, email, gender, birthDate } = passenger;
  

      if (
        !firstName || 
        !lastName || 
        !phoneNumber || 
        !email || 
        !gender || 
        !birthDate
      ) {
        toast.error("Tüm yolcu bilgileri eksiksiz doldurulmalıdır.");
        return false;
      }
      // test için tarayıcının localStore'dan price değeri değiştirilerek denenebilir
      // frontend'de bu tür önlemlerin tekrardan API'de alınacağını biliyorum. Çünkü frontend'de alınan önlemler, sunucuya istek yollanırken kolayca manipüle edilebilmekte.
      // ayrıca böyle uyarıdan ziyade fiyat bilgisi düzeltilerek isteğin yollanması daha doğru olabilir.
      if((tickets.seatNumbers.length * 1000) !== tickets.price){
        toast.error("Fiyat bilgisi uygun olmayan bir şekilde değiştirilmiş. Lütfen sayfayı yenileyiniz.");
        return false;
      }
    }
  
    return true;
  };