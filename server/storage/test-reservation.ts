// Bu dosya başlangıçta test rezervasyonu oluşturmak için kullanılır
// Böylece uygulama açılışında bir test rezervasyonumuz olacak

export const createTestReservation = (id: number) => {
  return {
    id,
    userId: 1,
    roomId: 1,
    checkIn: new Date(),
    checkOut: new Date(Date.now() + 86400000),
    numberOfGuests: 2,
    totalPrice: 1000,
    createdAt: new Date(),
    status: "confirmed",
    paymentMethod: "on_site",
    paymentStatus: "pending",
    paymentId: null
  };
};