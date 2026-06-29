import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { eventService } from '../services/eventService';

const avatarPresets = {
  'avatar-1': { icon: 'fa-user-astronaut', style: 'linear-gradient(135deg, #FF6B6B, #FF8E53)' },
  'avatar-2': { icon: 'fa-user-ninja', style: 'linear-gradient(135deg, #4E65FF, #92EFFD)' },
  'avatar-3': { icon: 'fa-user-tie', style: 'linear-gradient(135deg, #7F00FF, #E100FF)' },
  'avatar-4': { icon: 'fa-user-secret', style: 'linear-gradient(135deg, #11998e, #38ef7d)' },
  'avatar-5': { icon: 'fa-user-graduate', style: 'linear-gradient(135deg, #F9D423, #FF4E50)' },
  'avatar-6': { icon: 'fa-robot', style: 'linear-gradient(135deg, #8A2387, #E94057)' }
};

function HostAdmin() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [eventData, setEventData] = useState(null);
  const [attendeesList, setAttendeesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchVal, setSearchVal] = useState('');
  
  // Local state for settings form
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [checkinOpen, setCheckinOpen] = useState(true);
  const [requirePhone, setRequirePhone] = useState(false);

  useEffect(() => {
    async function loadEventData() {
      setLoading(true);
      const { data: event, error: eventErr } = await eventService.getEvent(slug);
      if (eventErr || !event) {
        alert("Sự kiện không tồn tại!");
        navigate('/');
        return;
      }
      setEventData(event);
      setTitle(event.title);
      setDesc(event.description || '');
      setCheckinOpen(event.is_checkin_open);
      setRequirePhone(event.require_phone);

      const { data: list, error: listErr } = await eventService.getAttendees(event.id);
      if (!listErr && list) {
        setAttendeesList(list);
      }
      setLoading(false);
    }
    loadEventData();
  }, [slug, navigate]);

  // Subscribe to real-time check-ins to keep the admin list synced
  useEffect(() => {
    if (!eventData) return;

    const unsubscribe = eventService.subscribeToAttendees(
      eventData.id,
      (newAttendee) => {
        setAttendeesList(prev => {
          if (prev.some(a => a.id === newAttendee.id)) return prev;
          return [newAttendee, ...prev];
        });
      },
      (deletedId) => {
        setAttendeesList(prev => prev.filter(a => a.id !== deletedId));
      },
      () => {
        setAttendeesList([]);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [eventData]);

  const handleUpdateDetails = async () => {
    if (!title.trim()) return;
    const { error } = await eventService.updateEvent(slug, {
      title: title.trim(),
      description: desc.trim()
    });
    if (error) {
      alert("Lỗi khi cập nhật thông tin: " + error.message);
    }
  };

  const handleToggleCheckin = async (e) => {
    const val = e.target.checked;
    setCheckinOpen(val);
    const { error } = await eventService.updateEvent(slug, { is_checkin_open: val });
    if (error) {
      alert("Lỗi: " + error.message);
      setCheckinOpen(!val);
    }
  };

  const handleTogglePhone = async (e) => {
    const val = e.target.checked;
    setRequirePhone(val);
    const { error } = await eventService.updateEvent(slug, { require_phone: val });
    if (error) {
      alert("Lỗi: " + error.message);
      setRequirePhone(!val);
    }
  };

  const handleKick = async (id, name) => {
    const confirmKick = confirm(`Bạn có chắc chắn muốn xóa thành viên "${name}" khỏi sự kiện không?`);
    if (!confirmKick) return;

    const { error } = await eventService.kickAttendee(id);
    if (!error) {
      setAttendeesList(prev => prev.filter(a => a.id !== id));
    } else {
      alert("Lỗi khi xóa thành viên: " + error.message);
    }
  };

  const handleResetEvent = async () => {
    const confirmReset = confirm("CẢNH BÁO:\nBạn có chắc chắn muốn xóa sạch toàn bộ danh sách check-in?\nThao tác này sẽ dọn dẹp sạch cả bảng và không thể phục hồi.");
    if (!confirmReset) return;

    const { error } = await eventService.resetEvent(eventData.id);
    if (!error) {
      setAttendeesList([]);
    } else {
      alert("Lỗi khi xóa sạch dữ liệu: " + error.message);
    }
  };

  const exportToCSV = () => {
    if (attendeesList.length === 0) {
      alert("Danh sách trống. Không thể xuất file CSV.");
      return;
    }

    let csvContent = 'Họ tên,Vai trò,Bio,Đang tìm kiếm,Có thể giúp đỡ,Điện thoại/Zalo,Email,Telegram,Facebook,LinkedIn,Instagram,Thời gian Check-in\r\n';
    
    attendeesList.forEach(guest => {
      const escape = (str) => {
        if (!str) return '';
        return `"${str.replace(/"/g, '""')}"`;
      };
      
      const phone = (guest.privacy?.phone && guest.contacts?.phone) ? guest.contacts.phone : 'Ẩn (Private)';
      const email = (guest.privacy?.email && guest.contacts?.email) ? guest.contacts.email : 'Ẩn (Private)';
      const telegram = (guest.privacy?.telegram && guest.contacts?.telegram) ? guest.contacts.telegram : 'Ẩn (Private)';
      const facebook = (guest.privacy?.facebook && guest.contacts?.facebook) ? guest.contacts.facebook : 'Ẩn (Private)';
      const linkedin = (guest.privacy?.linkedin && guest.contacts?.linkedin) ? guest.contacts.linkedin : 'Ẩn (Private)';
      const instagram = (guest.privacy?.instagram && guest.contacts?.instagram) ? guest.contacts.instagram : 'Ẩn (Private)';
      
      const row = [
        escape(guest.name),
        escape(guest.role),
        escape(guest.bio),
        escape(guest.looking),
        escape(guest.help),
        escape(phone),
        escape(email),
        escape(telegram),
        escape(facebook),
        escape(linkedin),
        escape(instagram),
        escape(guest.created_at ? new Date(guest.created_at).toLocaleString() : '')
      ];
      
      csvContent += row.join(',') + '\r\n';
    });
    
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const filename = `danh_sach_checkin_${slug}_${Date.now()}.csv`;
    
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadQRCode = () => {
    const checkinUrl = `${window.location.origin}${window.location.pathname}#/checkin/${slug}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(checkinUrl)}&color=ffffff&bgcolor=111218`;
    
    fetch(qrUrl)
      .then(resp => resp.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `qrcode_circlelink_${slug}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      })
      .catch(() => {
        window.open(qrUrl, '_blank');
      });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--text-secondary)' }}>
        <h3><i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '10px' }}></i> Đang tải cấu hình Admin...</h3>
      </div>
    );
  }

  const filteredList = attendeesList.filter(guest => {
    if (!searchVal) return true;
    const s = searchVal.toLowerCase();
    return guest.name.toLowerCase().includes(s) || guest.role.toLowerCase().includes(s);
  });

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
            <button className="nav-tab" onClick={() => navigate(`/event/${slug}`)}>
              <i className="fa-solid fa-desktop"></i>
              <span>Live Board</span>
            </button>
            <button className="nav-tab active">
              <i className="fa-solid fa-sliders"></i>
              <span>Host Admin</span>
            </button>
          </nav>
        </div>
      </header>

      <main className="app-container">
        <div className="host-admin-dashboard" style={{ display: 'grid' }}>
          
          {/* Left: Configuration & Settings Form */}
          <div className="host-card admin-settings glass">
            <div className="admin-header-title">
              <h3><i className="fa-solid fa-gears"></i> Thiết lập sự kiện</h3>
              <p>Điều chỉnh cấu hình check-in và quản lý dữ liệu.</p>
            </div>

            <div className="admin-settings-group">
              <label>Tên Sự Kiện</label>
              <div className="input-wrapper">
                <i className="fa-solid fa-heading input-icon"></i>
                <input 
                  type="text" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  onBlur={handleUpdateDetails}
                />
              </div>
            </div>

            <div className="admin-settings-group">
              <label>Mô tả sự kiện</label>
              <div className="input-wrapper">
                <i className="fa-solid fa-align-left input-icon"></i>
                <input 
                  type="text" 
                  value={desc} 
                  onChange={(e) => setDesc(e.target.value)} 
                  onBlur={handleUpdateDetails}
                />
              </div>
            </div>

            <div className="admin-settings-switches">
              <div className="admin-switch-row">
                <div className="switch-info">
                  <span class="switch-label">Mở cổng nhận Check-in</span>
                  <span class="switch-desc">Cho phép khách mời quét QR và gửi profile</span>
                </div>
                <label className="privacy-toggle">
                  <input type="checkbox" checked={checkinOpen} onChange={handleToggleCheckin} />
                  <span className="toggle-slider"></span>
                  <span className="toggle-text"><i className="fa-solid fa-power-off"></i></span>
                </label>
              </div>

              <div className="admin-switch-row">
                <div className="switch-info">
                  <span class="switch-label">Bắt buộc nhập Số điện thoại</span>
                  <span class="switch-desc">Yêu cầu SĐT ở form check-in để liên lạc</span>
                </div>
                <label className="privacy-toggle">
                  <input type="checkbox" checked={requirePhone} onChange={handleTogglePhone} />
                  <span className="toggle-slider"></span>
                  <span className="toggle-text"><i class="fa-solid fa-exclamation"></i></span>
                </label>
              </div>
            </div>

            <div className="admin-data-actions">
              <h4>Xuất báo cáo & Dữ liệu</h4>
              <div className="data-buttons-grid">
                <button onClick={exportToCSV} className="btn btn-secondary">
                  <i className="fa-solid fa-file-csv"></i> Xuất danh sách (CSV)
                </button>
                <button onClick={downloadQRCode} className="btn btn-outline">
                  <i className="fa-solid fa-download"></i> Tải QR Code (PNG)
                </button>
              </div>
              <button onClick={handleResetEvent} className="btn btn-outline btn-reset-danger">
                <i className="fa-solid fa-trash-can"></i> Xóa toàn bộ khách check-in
              </button>
            </div>
          </div>

          {/* Right: Moderation List */}
          <div className="host-card admin-moderation glass">
            <div className="section-title-bar">
              <h3><i className="fa-solid fa-users-gear"></i> Kiểm duyệt thành viên</h3>
              <div className="stat-badge">
                <span>{filteredList.length}</span> đã check-in
              </div>
            </div>

            <div className="admin-search-box">
              <i className="fa-solid fa-magnifying-glass"></i>
              <input 
                type="text" 
                placeholder="Tìm tên hoặc vai trò để xử lý nhanh..." 
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
              />
            </div>

            <div className="moderation-table-wrapper">
              <table className="moderation-table">
                <thead>
                  <tr>
                    <th>Thành viên</th>
                    <th>Vai trò</th>
                    <th>Thời gian</th>
                    <th style={{ textAlign: 'right' }}>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredList.length > 0 ? (
                    filteredList.map((guest) => {
                      const av = avatarPresets[guest.avatar] || avatarPresets['avatar-1'];
                      const timeStr = guest.created_at 
                        ? new Date(guest.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                        : '14:00';
                      return (
                        <tr key={guest.id}>
                          <td>
                            <div className="mod-member-cell">
                              <div className="mod-avatar" style={{ background: av.style }}>
                                <i className={`fa-solid ${av.icon}`}></i>
                              </div>
                              <span className="mod-name" title={guest.name}>{guest.name}</span>
                            </div>
                          </td>
                          <td>
                            <span className={`role-badge ${guest.role.toLowerCase()}`}>{guest.role}</span>
                          </td>
                          <td>
                            <span style={{ color: 'var(--text-secondary)' }}>{timeStr}</span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button onClick={() => handleKick(guest.id, guest.name)} className="btn-kick">
                              <i className="fa-solid fa-user-xmark"></i> Xóa
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                        <i className="fa-solid fa-circle-info" style={{ fontSize: '20px', display: 'block', marginBottom: '8px' }}></i>
                        Chưa có thành viên nào check-in hoặc khớp với tìm kiếm.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

export default HostAdmin;
