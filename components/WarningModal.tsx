import { useEffect, useState } from 'react';

type SimpleModalProps = {
  onRestart: () => void;
  onCloseOrApprove: () => void;
};

export default function WarningModal({ onRestart, onCloseOrApprove }: SimpleModalProps) {
  const [countdown, setCountdown] = useState(10);
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    if (countdown === 0) {
      onRestart();
      clearInterval(timer);
    }

    return () => clearInterval(timer);
  }, [countdown, onRestart]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-8 rounded-lg shadow-lg w-96">
        <h2 className="text-xl font-semibold mb-4">
          İşleme devam etmek istiyor musunuz? ({countdown} saniye kaldı)
        </h2>
        <div>
          <button
            onClick={onCloseOrApprove}
            className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 mr-2"
          >
            Yes
          </button>
        </div>
      </div>
    </div>
  );
}
