import React from "react";
import { useNavigate } from "react-router-dom";

const ChoosePatientType: React.FC = () => {
  const navigate = useNavigate();
  const goMainpage = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/patient-main");
  };
  return (
    <main className="flex items-center justify-center min-h-screen bg-gray-100 p-10">
      <div className="bg-white p-3 rounded-lg shadow-lg w-80 flex flex-col items-center min-h-[90vh]">
        <img
          src="public/icons/icon-192x192.png"
          className="w-[80%] h-auto object-cover p-1"
          alt="icon"
        />
        <h1 className="font-bold text-center mb-6 text-[13px] font-[TAEBAEKfont] leading-[1.8] text-[15px]">
          OOO님, 환영합니다. <br /> 서비스를 이용하는 대상을 골라주세요.
        </h1>
        <button
          onClick={goMainpage}
          type="submit"
          className="bg-gray-800 text-white rounded-[10px] w-[260px] h-[45px] text-[16px] mt-5 hover:bg-gray-400"
        >
          환자
        </button>
        <button
          onClick={goMainpage}
          type="submit"
          className="bg-gray-800 text-white rounded-[10px] w-[260px] h-[45px] text-[16px] mt-5 hover:bg-gray-400"
        >
          보호자
        </button>
      </div>
    </main>
  );
};

export default ChoosePatientType;
