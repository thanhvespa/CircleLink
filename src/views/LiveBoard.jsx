import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { eventService } from '../services/eventService';
import { isDemoMode } from '../supabaseClient';
import confetti from 'canvas-confetti';

const avatarPresets = {
  'avatar-1': { icon: 'fa-user-astronaut', style: 'linear-gradient(135deg, #FF6B6B, #FF8E53)' },
  'avatar-2': { icon: 'fa-user-ninja', style: 'linear-gradient(135deg, #4E65FF, #92EFFD)' },
  'avatar-3': { icon: 'fa-user-tie', style: 'linear-gradient(135deg, #7F00FF, #E100FF)' },
  'avatar-4': { icon: 'fa-user-secret', style: 'linear-gradient(135deg, #11998e, #38ef7d)' },
  'avatar-5': { icon: 'fa-user-graduate', style: 'linear-gradient(135deg, #F9D423, #FF4E50)' },
  'avatar-6': { icon: 'fa-robot', style: 'linear-gradient(135deg, #8A2387, #E94057)' }
};

const mockLib = [
  { name: 'Hoàng Lâm', role: 'Founder', bio: 'AI SaaS Founder. Tìm kiếm CTO.', avatar: 'avatar-3', looking: 'CTO, Seed Capital', help: 'SaaS Pitching, Fundraising', contacts: { phone: '0901234567', email: 'lam@hrtech.ai' }, privacy: { phone: true, email: true } },
  { name: 'Minh Thư', role: 'Designer', bio: 'UI/UX Designer Web3 & Mobile.', avatar: 'avatar-5', looking: 'Remote Project, Dev Partner', help: 'UI/UX Audits, Figma Systems', contacts: { email: 'thu@design.co' }, privacy: { email: true } },
  { name: 'Quốc Bảo', role: 'Developer', bio: 'Fullstack Dev. React, Next.js & Supabase.', avatar: 'avatar-1', looking: 'AI Startup, Freelance Gig', help: 'Vite Setup, SQL Queries', contacts: { phone: '0988776655', email: 'bao@dev.js' }, privacy: { phone: true, email: true } },
  { name: 'Thanh Hằng', role: 'Marketer', bio: 'Growth Marketer. TikTok Ads specialist.', avatar: 'avatar-4', looking: 'Early Stage App, Consulting', help: 'SEO Planning, Ad Campaigns', contacts: { email: 'hang@growth.agency' }, privacy: { email: true } }
];

function LiveBoard() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [eventData, setEventData] = useState(null);
  const [attendeesList, setAttendeesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  
  const attendeesRef = useRef([]);

  useEffect(() => {
    attendeesRef.current = attendeesList;
  }, [attendeesList]);

  useEffect(() => {
    async function loadEventAndAttendees() {
      setLoading(true);
      const { data: event, error: eventErr } = await eventService.getEvent(slug);
      if (eventErr || !event) {
        alert("Sự kiện không tồn tại!");
        navigate('/');
        return;
      }
      setEventData(event);

      const { data: list, error: listErr } = await eventService.getAttendees(event.id);
      if (!listErr && list) {
        setAttendeesList(list);
      }
      setLoading(false);
    }
    loadEventAndAttendees();
  }, [slug, navigate]);

  // Subscribe to real-time checkins
  useEffect(() => {
    if (!eventData) return;

    const unsubscribe = eventService.subscribeToAttendees(
      eventData.id,
      (newAttendee) => {
        // Trigger high-quality confetti explosion!
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#7c3aed', '#06b6d4', '#10b981', '#ec4899', '#f59e0b']
        });
        
        setAttendeesList(prev => {
          // Prevent duplicates in real-time callbacks
          if (prev.some(a => a.id === newAttendee.id)) return prev;
          return [newAttendee, ...prev];
        });
      },
      (deletedId) => {
        setAttendeesList(prev => prev.filter(a => a.id !== deletedId));
      },
      () => {
        setAttendeesList([]);
      },
      (updatedEvent) => {
        setEventData(updatedEvent);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [eventData]);

  const simulateGuest = async () => {
    if (!eventData || !eventData.is_checkin_open) {
      alert("Cổng check-in đang đóng. Hãy mở cổng check-in trong Bảng Quản Trị trước!");
      return;
    }

    const randPreset = mockLib[Math.floor(Math.random() * mockLib.length)];
    const firstNames = ['Dương', 'Phát', 'Trinh', 'Kiên', 'Hà', 'Lan', 'Nam', 'Trang', 'Khánh', 'Đạt'];
    const lastNames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Huỳnh', 'Phan', 'Vũ', 'Đặng'];
    const fakeName = lastNames[Math.floor(Math.random() * lastNames.length)] + ' ' + 
                     firstNames[Math.floor(Math.random() * firstNames.length)] + 
                     ` (${randPreset.role})`;

    const contacts = { ...randPreset.contacts };
    const privacy = { ...randPreset.privacy };

    if (eventData.require_phone) {
      contacts.phone = '09' + Math.floor(10000000 + Math.random() * 90000000);
      privacy.phone = true;
    }

    const newGuestData = {
      name: fakeName,
      role: randPreset.role,
      bio: randPreset.bio,
      avatar: randPreset.avatar,
      looking: randPreset.looking,
      help: randPreset.help,
      contacts: contacts,
      privacy: privacy
    };

    await eventService.addAttendee(eventData.id, newGuestData);
  };

  const simulateMultipleGuests = async () => {
    setSimulating(true);
    let count = 0;
    const interval = setInterval(async () => {
      await simulateGuest();
      count++;
      if (count >= 5) {
        clearInterval(interval);
        setSimulating(false);
      }
    }, 400);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--text-secondary)' }}>
        <h3><i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '10px' }}></i> Đang tải dữ liệu sự kiện...</h3>
      </div>
    );
  }

  // Calculate stats
  let founders = 0;
  let developers = 0;
  let designers = 0;
  let others = 0;

  attendeesList.forEach(a => {
    switch (a.role) {
      case 'Founder': founders++; break;
      case 'Developer': developers++; break;
      case 'Designer': designers++; break;
      default: others++; break;
    }
  });

  const checkinUrl = `${window.location.origin}${window.location.pathname}#/checkin/${slug}`;
  const qrCodeApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(checkinUrl)}&color=ffffff&bgcolor=111218`;

  return (
    <div className="dark-mode">
      <div className="bg-blob blob-1"></div>
      <div className="bg-blob blob-2"></div>
      <div className="bg-blob blob-3"></div>

      <header className="app-header">
        <div className="header-container">
          <Link to="/" className="logo">
            <div className="logo-icon">L</div>
            <span className="logo-text">Circle<span>Link</span></span>
          </Link>
          <nav className="nav-tabs">
            <button className="nav-tab active">
              <i className="fa-solid fa-desktop"></i>
              <span>Live Board</span>
            </button>
            <button className="nav-tab" onClick={() => navigate(`/event/${slug}/admin`)}>
              <i className="fa-solid fa-sliders"></i>
              <span>Host Admin</span>
            </button>
          </nav>
        </div>
      </header>

      <main className="app-container">
        <div className="host-grid">
          
          {/* Left: Event QR Info & Simulation */}
          <div className="host-card qr-section glass">
            <div className="event-details">
              <div className="event-title-badge">SỰ KIỆN ĐANG DIỄN RA</div>
              <h1>{eventData.title}</h1>
              <p>{eventData.description}</p>
            </div>

            <div className="qr-code-wrapper">
              <div className="qr-container">
                <img src={qrCodeApiUrl} alt="QR Check-in" />
                <div className="qr-overlay">
                  <span className="logo-icon mini">O</span>
                </div>
              </div>
              <div className="qr-instruction">
                <i className="fa-solid fa-qrcode"></i>
                <span>Quét mã để check-in & chia sẻ profile của bạn</span>
              </div>
            </div>

            {/* Simulation controls */}
            <div className="simulator-console">
              <div className="console-header">
                <i className="fa-solid fa-terminal"></i> Bảng điều khiển Demo (Simulator)
              </div>
              <p>Giả lập người check-in thời gian thực trên các thiết bị di động khác để thử nghiệm Live Board.</p>
              <div className="console-actions">
                <button onClick={simulateGuest} className="btn btn-secondary btn-glow" disabled={simulating}>
                  <i className="fa-solid fa-robot"></i> Mô phỏng 1 người
                </button>
                <button onClick={simulateMultipleGuests} className="btn btn-outline" disabled={simulating}>
                  <i className="fa-solid fa-users-rays"></i> Mô phỏng +5 người
                </button>
              </div>
              {isDemoMode && (
                <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--accent-violet)' }}>
                  * Đang chạy ở chế độ Demo Fallback (Dữ liệu lưu tạm trên trình duyệt này)
                </div>
              )}
            </div>
          </div>

          {/* Right: Live List Feed */}
          <div className="host-card live-stream-section glass">
            <div className="section-title-bar">
              <h2>
                <span className="live-indicator"></span>
                <span>Khách vừa Check-in</span>
              </h2>
              <div className="stat-badge">
                <span>{attendeesList.length}</span> đã tham gia
              </div>
            </div>

            <div className="live-stats-row">
              <div className="stat-mini-card">
                <span className="stat-val">{founders}</span>
                <span className="stat-label">Founder</span>
              </div>
              <div className="stat-mini-card">
                <span className="stat-val">{developers}</span>
                <span className="stat-label">Developer</span>
              </div>
              <div className="stat-mini-card">
                <span className="stat-val">{designers}</span>
                <span className="stat-label">Designer</span>
              </div>
              <div className="stat-mini-card">
                <span className="stat-val">{others}</span>
                <span className="stat-label">Khác</span>
              </div>
            </div>

            <div className="live-stream-list">
              {attendeesList.length > 0 ? (
                attendeesList.map((guest) => {
                  const av = avatarPresets[guest.avatar] || avatarPresets['avatar-1'];
                  const checkinTime = guest.created_at 
                    ? new Date(guest.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                    : '14:00';
                  return (
                    <div key={guest.id} className="live-guest-item">
                      <div className="guest-item-avatar" style={{ background: av.style }}>
                        <i className={`fa-solid ${av.icon}`}></i>
                      </div>
                      <div className="guest-item-info">
                        <div className="guest-item-name-row">
                          <span className="guest-item-name">{guest.name}</span>
                          <span className={`role-badge ${guest.role.toLowerCase()}`}>{guest.role}</span>
                        </div>
                        <div className="guest-item-bio">{guest.bio}</div>
                        {(guest.looking || guest.help) && (
                          <div className="guest-item-icebreakers">
                            {guest.looking && guest.looking !== 'Không chia sẻ cụ thể.' && (
                              <span className="icebreaker-tag looking">
                                <i className="fa-solid fa-magnifying-glass"></i> Tìm: {guest.looking}
                              </span>
                            )}
                            {guest.help && guest.help !== 'Không chia sẻ cụ thể.' && (
                              <span className="icebreaker-tag help">
                                <i className="fa-solid fa-handshake-angle"></i> Giúp: {guest.help}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="guest-item-time">{checkinTime}</div>
                    </div>
                  );
                })
              ) : (
                <div className="empty-stream">
                  <i className="fa-solid fa-ghost"></i>
                  <p>Chưa có ai check-in. Sử dụng bảng điều khiển giả lập bên cạnh để kiểm tra!</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

export default LiveBoard;
