import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  QrCode,
  LogOut,
  Award,
  BookOpen,
  ClipboardCheck,
  Calendar,
  PenTool,
  Monitor,
  CreditCard,
  FileText,
  Settings,
  ShieldCheck,
  Shield,
  DoorOpen,
  Star,
  Wallet,
  Layers,
  Video,
  Trophy
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { motion, AnimatePresence } from 'framer-motion';

const Sidebar = ({ isOpen, toggle }: { isOpen: boolean; toggle: () => void }) => {
  const location = useLocation();
  const { logout, user } = useAuthStore();

  const role = user?.role?.toUpperCase();

  const menuGroups = [
    {
      label: 'Chính',
      items: [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['STUDENT', 'QTV', 'LECTURER', 'BCH'] },
      ]
    },
    {
      label: 'Quản lý học tập',
      items: [
        { name: role === 'LECTURER' ? 'Lịch giảng dạy' : 'Thời khóa biểu', path: '/schedule', icon: Calendar, roles: ['STUDENT', 'LECTURER'] },
        { name: 'Bảng điểm', path: '/grades', icon: Award, roles: ['STUDENT'] },
        { name: 'Nhập điểm', path: '/grades/manage', icon: Star, roles: ['QTV', 'LECTURER', 'BCH'] },
        { name: 'Đăng ký học phần', path: '/registration', icon: BookOpen, roles: ['STUDENT'] },
        { name: 'Chương trình đào tạo', path: '/curriculum/my', icon: Layers, roles: ['STUDENT'] },
        { name: 'Thanh toán học phí', path: '/tuition', icon: Wallet, roles: ['STUDENT'] },
      ]
    },
    {
      label: 'E-Learning',
      items: [
        { name: 'Hệ thống học tập', path: '/elearning', icon: Monitor, roles: ['STUDENT'] },
        { name: 'Bài giảng', path: '/elearning/lectures', icon: Video, roles: ['STUDENT'] },
        { name: 'Bài tập', path: '/elearning/assignments', icon: PenTool, roles: ['STUDENT'] },
        { name: 'Thi online', path: '/elearning/exam', icon: Monitor, roles: ['STUDENT'] },
        { name: 'Quản lý E-Learning', path: role === 'QTV' ? '/elearning/admin/courses' : '/elearning/manage', icon: Monitor, roles: ['QTV', 'LECTURER'] },
      ]
    },
    {
      label: 'Điểm rèn luyện',
      items: [
        { name: 'Phiếu tự đánh giá', path: '/training/evaluation/self', icon: ClipboardCheck, roles: ['STUDENT'] },
        { name: 'Minh chứng hoạt động', path: '/training/evidence', icon: ShieldCheck, roles: ['STUDENT'] },
        { name: 'Danh hiệu & Khen thưởng', path: '/training/awards', icon: Trophy, roles: ['STUDENT'] },
        { name: 'Kết quả rèn luyện', path: '/training/results', icon: Calendar, roles: ['STUDENT'] },
        { name: 'Quản lý DRL', path: '/drl', icon: ClipboardCheck, roles: ['QTV', 'LECTURER', 'BCH'] },
        { name: 'Quản lý hoạt động QR', path: '/activities/manage', icon: QrCode, roles: ['QTV'] },
      ]
    },
    {
      label: 'Tài chính',
      items: [
        { name: 'Học phí', path: '/tuition', icon: CreditCard, roles: ['STUDENT'] },
        { name: 'Lịch sử giao dịch', path: '/tuition/history', icon: FileText, roles: ['STUDENT'] },
      ]
    },
    {
      label: 'Hệ thống',
      items: [
        { name: 'Sinh viên', path: '/students', icon: Users, roles: ['QTV', 'LECTURER', 'BCH'] },
        { name: 'Khoa và Lớp', path: '/classes', icon: BookOpen, roles: ['QTV', 'BCH'] },
        { name: 'Học kỳ', path: '/semesters', icon: Calendar, roles: ['QTV'] },
        { name: 'Quản lý lịch học', path: '/timetable/manage', icon: Calendar, roles: ['QTV'] },
        { name: 'Quản lý phòng', path: '/timetable/rooms', icon: DoorOpen, roles: ['QTV'] },
        { name: 'Chương trình khung', path: '/curriculum/manage', icon: BookOpen, roles: ['QTV'] },
        { name: 'Quản lý học phí', path: '/finance/manage', icon: Wallet, roles: ['QTV'] },
        { name: 'Cài đặt hệ thống', path: '/settings', icon: Settings, roles: ['QTV'] },
        { name: 'Quản trị hệ thống', path: '/bch', icon: Shield, roles: ['QTV'] },
      ]
    }
  ];

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
            onClick={toggle}
          />
        )}
      </AnimatePresence>

      <aside className={`fixed top-0 left-0 z-50 h-screen w-72 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 bg-white border-r border-slate-100 shadow-2xl lg:shadow-none`}>
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="p-8 pb-6 shrink-0">
            <div className="flex items-center gap-3 group cursor-pointer">
              <div className="h-10 w-10 rounded-xl overflow-hidden shadow-lg shadow-slate-200/50">
                <img src="/logoctut.png" alt="Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tighter text-slate-900 leading-none">My<span className="text-blue-600">CTUTs</span></h1>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1">Student Portal</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 space-y-7 overflow-y-auto custom-scrollbar py-2">
            {menuGroups.map((group, idx) => {
              const visibleItems = group.items.filter(item => item.roles.includes(role || ''));
              if (visibleItems.length === 0) return null;

              return (
                <div key={idx} className="space-y-1.5">
                  <p className="px-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">{group.label}</p>
                  <div className="space-y-0.5">
                    {visibleItems.map((item) => {
                      const active = location.pathname === item.path;
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => window.innerWidth < 1024 && toggle()}
                          className={`group flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-200 ${active
                              ? 'bg-blue-50 text-blue-600 shadow-sm'
                              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <item.icon size={18} className={active ? 'text-blue-600' : 'text-slate-400 group-hover:text-blue-600 transition-colors'} />
                            <span className="text-xs font-black tracking-tight">{item.name}</span>
                          </div>
                          {active && <div className="h-1.5 w-1.5 rounded-full bg-blue-600" />}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>

          {/* Footer Actions */}
          <div className="p-4 mt-auto space-y-1 border-t border-slate-50">
            <Link
              to={role === 'STUDENT' ? '/profile' : '/settings'}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all"
            >
              <Settings size={18} className="text-slate-400" />
              <span className="text-xs font-black tracking-tight">
                {role === 'STUDENT' ? 'Tài khoản & Bảo mật' : 'Cài đặt'}
              </span>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-all w-full text-left"
            >
              <LogOut size={18} className="text-slate-400" />
              <span className="text-xs font-black tracking-tight">Đăng xuất</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
