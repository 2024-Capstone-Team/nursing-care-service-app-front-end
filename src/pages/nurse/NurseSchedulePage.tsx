import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import NurseCalendar from "../../components/nurse/NurseCalendar";
import ScheduleEditForm from "../../components/nurse/NurseScheduleEdit";
import ScheduleAdd from "../../components/nurse/NurseScheduleAdd";
import logo from "../../assets/carebridge_logo.png";
import bar from "../../assets/hamburger bar.png";
import home from "../../assets/home.png";
import schedular from "../../assets/schedular.png";
import macro from "../../assets/macro.png";
import dwarrows from "../../assets/down arrows.png";
import qresponse from "../../assets/quick response.png";
import axios from "axios";

interface Patient {
  patientId: number;
  name: string;
  birthDate: string;
}

const NurseSchedulePage: React.FC = () => {
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [modeCalendar, setModeCalendar] = useState(true);
  const [modeEdit, setModeEdit] = useState(false);
  const [modeAdd, setModeAdd] = useState(false);
  const { scheduleId } = useParams<{ scheduleId: string }>();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);

  // 생년월일 포맷 변환 함수
  const formatBirthdate = (birthdate: string | null | undefined) => {
    if (!birthdate) return "정보 없음";

    try {
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

  // API 호출하여 환자 데이터 가져오기
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const staffId = 1; // 임시 staff_id
        const response = await axios.get(`http://localhost:8080/api/patient/users/${staffId}`);
        console.log(response.data); // 응답 데이터 확인
        const fetchedPatients = response.data.map((patient: any) => ({
          patientId: patient.patientId,
          name: patient.name,
          birthDate: patient.birthDate,
        }));

        // 이름 기준으로 환자 정렬
        fetchedPatients.sort((a: Patient, b: Patient) =>
          a.name.localeCompare(b.name, "ko", { sensitivity: "base" })
        );
        setPatients(fetchedPatients);
        setLoading(false);
      } catch (error) {
        console.error("환자 데이터를 가져오는 중 오류 발생:", error);
        setLoading(false);
      }
    };

    fetchPatients();
  }, []);

  const navigate = useNavigate();
  const location = useLocation();

  const handleLogoClick = () => {
    navigate('/nurse-main');
  };

  const handleHamburgerClick = (event: React.MouseEvent<HTMLImageElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setDropdownPosition({ top: rect.bottom + window.scrollY, left: rect.left });
    setIsDropdownVisible((prev) => !prev); 
  };

   // 스케줄 수정 시 호출
   const handleEditSchedule = (scheduleId: string) => {
    setEditingScheduleId(scheduleId); // 수정할 스케줄 ID 저장
    setModeCalendar(false);
    setModeAdd(false);
    setModeEdit(true);
  };

  // 스케줄 추가 버튼 클릭 시 호출
  const handleAddSchedule = () => {
    setModeCalendar(false);
    setModeEdit(false);
    setModeAdd(true);
  };

  // 취소 버튼 클릭 시 호출
  const handleCancel = () => {
    setModeCalendar(true);
    setModeEdit(false);
    setModeAdd(false);
    setEditingScheduleId(null); // 수정 상태 초기화
  };

  const handleMacroClick = () => {
    navigate("/nurse-main", { state: { macroMode: true } });
  };

  const handleQAClick = () => {
    navigate("/nurse-main", { state: { QAMode: true } });
  };
  
  const handleMenuClick = (path: string) => {
    if (path === "/nurse-schedule") {
      setModeCalendar(true);
      setModeEdit(false);
      setModeAdd(false);
    }
    navigate(path);
  }

  // location.state의 view 값에 따라 초기 모드 설정
  useEffect(() => {
    if (location.state?.view === "edit" && location.state.scheduleId) {
      setModeCalendar(false);
      setModeEdit(true);
      setModeAdd(false);
      setEditingScheduleId(location.state.scheduleId);
    } else if (location.state?.view === "add") {
      setModeCalendar(false);
      setModeEdit(false);
      setModeAdd(true);
    } else {
      setModeCalendar(true);
      setModeEdit(false);
      setModeAdd(false);
    }
  }, [location]);

  return (
    /*전체 페이지 창*/
    <div className="flex flex-col h-screen bg-[#DFE6EC] overflow-hidden">
      
      {/*햄버거바 + 로고 영역*/}
      <div className="flex items-center pl-7">
        <img
          src={isDropdownVisible ? dwarrows : bar}
          alt="hamburger bar"
          className="relative w-[1.7em] h-[1.7em] mr-2 cursor-pointer"
          onClick={handleHamburgerClick}
        />
        {isDropdownVisible && (
          <div
            className="absolute top-[2.5em] left-[0px] mt-2 w-[200px] bg-white shadow-lg rounded-md border"
            style={{ top: dropdownPosition.top, left: dropdownPosition.left }}
          >
            <p className="text-black text-[15px] font-semibold pt-2 px-2">서울아산병원</p>
            <p className="text-gray-500 text-[13px] pt-1 pb-2 px-2">일반외과 병동</p>
            <hr className="bg-gray-600"></hr>

            <ul className="py-2">
              <li className="px-2 pt-2 pb-1 text-[13px] font-semibold hover:bg-gray-100 cursor-pointer flex items-center"
                onClick={() => handleMenuClick("/nurse-main")}>
                <img src={home} alt="home" className="w-4 h-4 mr-2" /> 메인 화면
              </li>
              <li className="px-2 py-1 text-[13px] font-semibold hover:bg-gray-100 cursor-pointer flex items-center"
                onClick={() => handleMenuClick("/nurse-schedule")}>
                <img src={schedular} alt="schedular" className="w-4 h-4 mr-2" /> 스케줄러
              </li>
              <li className="px-2 py-1 text-[13px] font-semibold hover:bg-gray-100 cursor-pointer flex items-center"
                onClick={handleMacroClick}>
                <img src={macro} alt="macro" className="w-4 h-4 mr-2" /> 매크로 설정
              </li>
              <li className="px-2 pt-1 pb-2 text-[13px] font-semibold hover:bg-gray-100 cursor-pointer flex items-center"
                onClick={handleQAClick}>
                <img src={qresponse} alt="qresponse" className="w-4 h-4 mr-2" /> 빠른 답변 설정
              </li>
              <hr className="bg-gray-600"></hr>
              <li className="px-2 pt-2 pb-1 text-[13px] text-gray-500 hover:bg-gray-100 cursor-pointer"
                onClick={() => handleMenuClick("/nurse-reset-password")}> 비밀번호 재설정
              </li>
              <li className="px-2 py-1 text-[13px] text-gray-500 hover:bg-gray-100 cursor-pointer"
                onClick={() => handleMenuClick("/nurse-login")}> 로그아웃
              </li>
            </ul>
          </div>
        )}
        <img
          src={logo}
          alt="CareBridge 로고"
          className="w-[7.5em] h-[7.5em] cursor-pointer"
          onClick={handleLogoClick}
        />  
      </div>

      {/*스케줄 메인 페이지 영역*/}
      <div className="flex flex-1 overflow-hidden">
        {/*환자 목록 영역*/}
        <div className="flex flex-col bg-[#96B2C7] w-1/6 rounded-lg px-2 mb-4 ml-4 mr-2 shadow-md overflow-hidden">
          <h2 className="text-black font-semibold text-lg mt-2 pl-2">환자 목록</h2>

          {/* 추가 버튼 영역 */}
          <div className="flex justify-end items-center pl-2 mb-1">
            <button
              className="text-sm text-gray-600 bg-transparent hover:text-gray-400 focus:outline-none"
              onClick={handleAddSchedule}>
              추가
            </button>
          </div>

          {/*환자 목록 영역*/}
          <div className="h-[calc(100vh-14rem)] bg-white rounded-lg p-2 shadow-md overflow-y-auto">
            <ul>
              {patients.map((patient) => (
                <li key={patient.patientId} className="flex flex-col border-b border-gray-200 py-2 pl-1">
                  <span className="text-md font-semibold">{patient.name}</span>
                  <p className="text-sm text-gray-500">{formatBirthdate(patient.birthDate)}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="flex flex-col flex-1 bg-white rounded-lg shadow-md mb-4 ml-2 mr-4 px-4 overflow-y-auto">
          {modeCalendar && <NurseCalendar onEdit={handleEditSchedule} />}
            {modeEdit && editingScheduleId && (
              <ScheduleEditForm scheduleId={editingScheduleId} onCancel={handleCancel} />
            )}
            {modeAdd && <ScheduleAdd onCancel={handleCancel} />}
        </div>
      </div>
    </div>
  );
};

export default NurseSchedulePage;
