import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  LogOut,
  Award,
  BookOpen,
  Calendar,
  PenTool,
  Monitor,
  FileText,
  ShieldCheck,
  Layers,
  Video,
  X,
  User,
  Trophy,
  History as HistoryIcon,
  CreditCard,
  Users,
  GraduationCap,
  ClipboardCheck,
  Settings,
  DollarSign,
  BookMarked,
  Library,
  FileSpreadsheet
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmModal from '../components/ConfirmModal';

const Sidebar = ({ isOpen, toggle }: { isOpen: boolean; toggle: () => void }) => {
  const location = useLocation();
  const { logout, user } = useAuthStore();
  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);

  const role = user?.role?.toUpperCase();

  const menuGroups = [
    {
      label: 'Chính',
      items: [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['STUDENT', 'QTV', 'LECTURER', 'BCH'] },
      ]
    },
    {
      label: 'Quản lý Chung',
      items: [
        { name: 'Danh sách sinh viên', path: '/students', icon: Users, roles: ['QTV', 'LECTURER', 'BCH'] },
        { name: 'Quản lý lớp học', path: '/classes', icon: GraduationCap, roles: ['QTV', 'BCH'] },
        { name: 'Quản lý điểm số', path: '/grades/manage', icon: FileSpreadsheet, roles: ['QTV', 'LECTURER'] },
        { name: 'Quản lý điểm danh', path: '/attendance/manage', icon: ClipboardCheck, roles: ['QTV', 'LECTURER', 'BCH'] },
        { name: 'Quản lý tài khoản', path: '/accounts', icon: User, roles: ['QTV'] },
      ]
    },
    {
      label: 'Công tác Giảng dạy',
      items: [
        { name: 'Lịch giảng dạy', path: '/schedule', icon: Calendar, roles: ['LECTURER'] },
        { name: 'Khóa học của tôi', path: '/elearning/manage/courses', icon: Library, roles: ['LECTURER'] },
        { name: 'Quản lý bài giảng', path: '/elearning/manage/lessons', icon: Video, roles: ['LECTURER'] },
        { name: 'Quản lý bài tập', path: '/elearning/manage/assignments', icon: PenTool, roles: ['LECTURER'] },
        { name: 'Quản lý kỳ thi', path: '/elearning/manage/exams', icon: Monitor, roles: ['LECTURER'] },
      ]
    },
    {
      label: 'Quản lý Đào tạo & E-Learning',
      items: [
        { name: 'Học kỳ & Niên khóa', path: '/semesters', icon: Calendar, roles: ['QTV'] },
        { name: 'Chương trình đào tạo', path: '/curriculum/manage', icon: Layers, roles: ['QTV'] },
        { name: 'Quản lý môn học', path: '/academic/manage', icon: BookMarked, roles: ['QTV'] },
        { name: 'Thời khóa biểu', path: '/timetable/manage', icon: Calendar, roles: ['QTV'] },
        { name: 'Quản trị E-Learning', path: '/elearning/admin/courses', icon: Monitor, roles: ['QTV'] },
      ]
    },
    {
      label: 'Quản lý Hoạt động & DRL',
      items: [
        { name: 'Duyệt điểm rèn luyện', path: '/training/approval', icon: ShieldCheck, roles: ['QTV', 'BCH'] },
        { name: 'Hoạt động & Sự kiện', path: '/activities/manage', icon: Monitor, roles: ['QTV', 'BCH'] },
        { name: 'Quản lý DRL chung', path: '/drl', icon: FileText, roles: ['QTV', 'LECTURER', 'BCH'] },
      ]
    },
    {
      label: 'Quản lý Tài chính',
      items: [
        { name: 'Quản lý học phí', path: '/finance/manage', icon: DollarSign, roles: ['QTV'] },
      ]
    },
    {
      label: 'Cá nhân & Học tập',
      items: [
        { name: 'Thời khóa biểu', path: '/schedule', icon: Calendar, roles: ['STUDENT'] },
        { name: 'Bảng điểm', path: '/grades', icon: Award, roles: ['STUDENT'] },
        { name: 'Hệ thống học tập', path: '/elearning', icon: Monitor, roles: ['STUDENT'] },
        { name: 'Đăng ký học phần', path: '/registration', icon: BookOpen, roles: ['STUDENT'] },
        { name: 'CT đào tạo cá nhân', path: '/curriculum/my', icon: Layers, roles: ['STUDENT'] },
      ]
    },
    {
      label: 'Tài chính & Rèn luyện',
      items: [
        { name: 'Học phí cá nhân', path: '/tuition', icon: CreditCard, roles: ['STUDENT'] },
        { name: 'Lịch sử giao dịch', path: '/tuition/history', icon: HistoryIcon, roles: ['STUDENT'] },
        { name: 'Phiếu tự đánh giá', path: '/training/evaluation/self', icon: FileText, roles: ['STUDENT'] },
        { name: 'Minh chứng hoạt động', path: '/training/evidence', icon: ShieldCheck, roles: ['STUDENT'] },
        { name: 'Danh hiệu & Khen thưởng', path: '/training/awards', icon: Trophy, roles: ['STUDENT'] },
        { name: 'Kết quả rèn luyện', path: '/training/results', icon: Calendar, roles: ['STUDENT'] },
      ]
    },
    {
      label: 'Hệ thống',
      items: [
        { name: 'Tài khoản & Bảo mật', path: '/profile', icon: User, roles: ['STUDENT', 'QTV', 'LECTURER', 'BCH'] },
        { name: 'Thiết lập hệ thống', path: '/bch', icon: Settings, roles: ['QTV'] },
        { name: 'Lịch sử thay đổi', path: '/system/audit', icon: HistoryIcon, roles: ['STUDENT', 'QTV', 'LECTURER', 'BCH'] },
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
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-40 lg:hidden"
            onClick={toggle}
          />
        )}
      </AnimatePresence>

      <aside className={`fixed top-0 left-0 z-50 h-screen w-[240px] transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 bg-[#0046a8] text-white shadow-2xl lg:shadow-none`}>
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="p-6 pb-5 shrink-0 flex items-center justify-between sm:p-7 sm:pb-5">
            <div className="flex min-w-0 items-center gap-3.5">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border border-white/35 bg-white/10 shadow-[0_14px_28px_-14px_rgba(15,23,42,0.85)]">
                <img
                  src="/logoctut.png?v=2"
                  alt="CTUT Logo"
                  className="h-full w-full object-cover scale-[1.02]"
                />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-black tracking-tighter text-white leading-none uppercase">MY <span className="text-blue-200">CTUT</span></h1>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-100/80">Cổng sinh viên</p>
              </div>
            </div>
            <button onClick={toggle} className="lg:hidden h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-white active:scale-90 transition-transform">
               <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 space-y-8 overflow-y-auto custom-scrollbar py-6">
            {menuGroups.map((group, idx) => {
              const visibleItems = group.items.filter(item => {
                const userRole = (role || '').toUpperCase();
                return item.roles.some(r => r.toUpperCase() === userRole);
              });
              if (visibleItems.length === 0) return null;

              return (
                <div key={idx} className="space-y-3">
                  <p className="px-4 text-[10px] font-black text-blue-200/50 uppercase tracking-widest">{group.label}</p>
                  <div className="space-y-1">
                    {visibleItems.map((item) => {
                      const active = location.pathname === item.path;
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => window.innerWidth < 1024 && toggle()}
                          className={`group flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 ${active
                              ? 'bg-blue-600/40 text-white font-bold'
                              : 'text-blue-100 hover:bg-white/10'
                            }`}
                        >
                          <item.icon size={20} className={active ? 'text-white' : 'text-blue-200/60 group-hover:text-white'} />
                          <span className="text-sm font-medium tracking-tight">{item.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>

          {/* Footer Actions */}
          <div className="p-4 mt-auto border-t border-white/10">
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="flex items-center gap-4 px-4 py-3 rounded-xl text-rose-300 hover:bg-rose-500/10 transition-all w-full text-left"
            >
              <LogOut size={20} />
              <span className="text-sm font-black tracking-tight">Đăng xuất</span>
            </button>
          </div>
        </div>
      </aside>

      <ConfirmModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        title="Xác nhận đăng xuất?"
        message="Bạn có chắc chắn muốn rời khỏi hệ thống? Mọi thay đổi chưa lưu có thể bị mất."
        confirmText="Đăng xuất ngay"
        cancelText="Ở lại"
        type="danger"
      />
    </>
  );
};

export default Sidebar;
