import React, { useState, useEffect } from "react";
import { FaSearch } from "react-icons/fa";
import back from "../../assets/back.png";
import Fuse from "fuse.js";
import axios from "axios";

interface PatientInfo {
  patientId: number;
  name: string;
  birthDate: string;
  gender: string;
}

interface NursePatientInfoProps {
  onPatientClick: (patientId: number) => void; // 환자 클릭 핸들러
}

const NursePatientInfo: React.FC<NursePatientInfoProps> = ({ onPatientClick }) => {
  const [patients, setPatients] = useState<PatientInfo[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const fuse = new Fuse(patients, {
    keys: ["name"],
    threshold: 0.3, // 검색 정확도 설정
  });


  // 생년월일 포맷 변환 함수
  const formatBirthdate = (birthdate: string | null | undefined) => {
    if (!birthdate) return "정보 없음";

    try {
      // 'T' 이후를 제거하고 날짜만 추출
      const trimmedDate = birthdate.split("T")[0];
      const [year, month, day] = trimmedDate.split("-");
      if (year && month && day) {
        return `${year}.${month}.${day}`;
      }
      return "정보 없음";
    } catch (error) {
      console.error("formatBirthdate 처리 중 에러:", error);
      return "정보 없음";
    }
  };


  // 성별 변환 함수
  const formatGender = (gender: string | undefined) => {
    if (!gender) return "정보 없음";
    return gender === "Male" ? "남" : gender === "Female" ? "여" : "정보 없음";
  };


  // API로부터 환자 데이터 가져오기
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const staffId = 1; // 임시 staff_id 값
        const response = await axios.get(`http://localhost:8080/api/patient/users/${staffId}`);
        const fetchedPatients = response.data.map((patient: any) => ({
          patientId: patient.patientId,
          name: patient.name,
          birthDate: patient.birthDate,
          gender: patient.gender,
        }));

        // 이름 기준으로 정렬
        fetchedPatients.sort((a: PatientInfo, b: PatientInfo) =>
          a.name.localeCompare(b.name, "ko", { sensitivity: "base" })
        );

        setPatients(fetchedPatients);
      } catch (error) {
        console.error("환자 데이터를 가져오는 중 에러 발생:", error);
      }
    };

    fetchPatients();
  }, []);


  // 검색어에 따라 필터링된 환자 목록
  const filteredPatients = searchQuery
    ? fuse.search(searchQuery).map((result) => result.item)
    : patients;


  return (
    <div className="bg-[#DFE6EC] p-3 rounded-lg ">
      <h2 className="text-lg font-bold mb-4">환자 정보</h2>

      {/*검색 입력 창*/}
        <div className="flex bg-white w-full mb-3 px-1 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-300">
          <FaSearch className="text-gray-600 mx-2 h-[20px] w-[20px] pt-1" />
          <input 
            type="text" 
            placeholder="환자 이름을 입력해주세요." 
            className="border-none outline-none w-full" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}/>  
        </div>

        {/*환자 목록 영역*/}
        <div className="space-y-4 h-[350px] overflow-y-auto scrollbar-hide">
          <ul className="space-y-4 w-full cursor-pointer">
            {filteredPatients.map((patient) => (
              <li key={patient.patientId} className="flex flex-col" onClick={() => onPatientClick(patient.patientId)}>
                <div className="text-base font-semibold">{patient.name}</div>
                <div className="text-sm text-gray-600">
                  <span>{formatBirthdate(patient.birthDate)} {formatGender(patient.gender)}</span>
                </div>
                <hr className="border-gray-300 mt-2 -mb-2"></hr>
              </li>
            ))}
          </ul>
        </div>   
      </div>
  );
};

export default NursePatientInfo;