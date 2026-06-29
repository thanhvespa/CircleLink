import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { eventService } from '../services/eventService';
import confetti from 'canvas-confetti';

const avatarPresets = {
  'avatar-1': { icon: 'fa-user-astronaut', style: 'linear-gradient(135deg, #FF6B6B, #FF8E53)' },
  'avatar-2': { icon: 'fa-user-ninja', style: 'linear-gradient(135deg, #4E65FF, #92EFFD)' },
  'avatar-3': { icon: 'fa-user-tie', style: 'linear-gradient(135deg, #7F00FF, #E100FF)' },
  'avatar-4': { icon: 'fa-user-secret', style: 'linear-gradient(135deg, #11998e, #38ef7d)' },
  'avatar-5': { icon: 'fa-user-graduate', style: 'linear-gradient(135deg, #F9D423, #FF4E50)' },
  'avatar-6': { icon: 'fa-robot', style: 'linear-gradient(135deg, #8A2387, #E94057)' }
};

function GuestCheckin() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [eventData, setEventData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState('');

  // Form Fields
  const [avatar, setAvatar] = useState('avatar-1');
  const [fullname, setFullname] = useState('');
  const [role, setRole] = useState('');
  const [bio, setBio] = useState('');
  const [looking, setLooking] = useState('');
  const [help, setHelp] = useState('');

  // Contact & Privacy States
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [telegram, setTelegram] = useState('');
  const [facebook, setFacebook] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [instagram, setInstagram] = useState('');

  const [sharePhone, setSharePhone] = useState(true);
  const [shareEmail, setShareEmail] = useState(true);
  const [shareTelegram, setShareTelegram] = useState(true);
  const [shareFacebook, setShareFacebook] = useState(true);
  const [shareLinkedin, setShareLinkedin] = useState(true);
  const [shareInstagram, setShareInstagram] = useState(true);

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadEvent() {
      setLoading(true);
      const { data: event, error } = await eventService.getEvent(slug);
      if (error || !event) {
        alert("Sự kiện không tồn tại!");
        navigate('/');
        return;
      }
      setEventData(event);
      setLoading(false);
    }
    loadEvent();
  }, [slug, navigate]);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullname || !role || !bio) return;

    if (eventData.require_phone && !phone.trim()) {
      showToast('⚠️ Vui lòng nhập Số điện thoại để tham gia.');
      return;
    }

    setSubmitting(true);

    const attendeeData = {
      name: fullname.trim(),
      role,
      bio: bio.trim(),
      avatar,
      looking: looking.trim() || 'Không chia sẻ cụ thể.',
      help: help.trim() || 'Không chia sẻ cụ thể.',
      contacts: {
        phone: phone.trim(),
        email: email.trim(),
        telegram: telegram.trim(),
        facebook: facebook.trim(),
        linkedin: linkedin.trim(),
        instagram: instagram.trim()
      },
      privacy: {
        phone: sharePhone,
        email: shareEmail,
        telegram: shareTelegram,
        facebook: shareFacebook,
        linkedin: shareLinkedin,
        instagram: shareInstagram
      }
    };

    const { error } = await eventService.addAttendee(eventData.id, attendeeData);
    setSubmitting(false);

    if (error) {
      alert("Lỗi check-in: " + error.message);
    } else {
      // Trigger confetti explosion!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      showToast('🎉 Check-in thành công!');
      
      // Redirect to Directory
      setTimeout(() => {
        navigate(`/directory/${slug}`);
      }, 1000);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--text-secondary)' }}>
        <h3><i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '10px' }}></i> Đang chuẩn bị cổng check-in...</h3>
      </div>
    );
  }

  // If check-in gate is closed by host, render the locked gate view
  if (!eventData.is_checkin_open) {
    return (
      <div className="dark-mode">
        <div className="bg-blob blob-1"></div>
        <div className="bg-blob blob-2"></div>
        <div className="bg-blob blob-3"></div>
        
        <div className="checkin-container glass" style={{ marginTop: '100px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', color: 'var(--accent-pink)', marginBottom: '16px' }}>
            <i className="fa-solid fa-lock"></i>
          </div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: '800', marginBottom: '8px' }}>Cổng Check-in Đã Đóng</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            Host đã đóng cổng đăng ký cho sự kiện: <strong>{eventData.title}</strong>.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <Link to={`/directory/${slug}`} className="btn btn-primary">
              <i className="fa-solid fa-address-book"></i> Xem danh bạ sự kiện
            </Link>
            <Link to="/" className="btn btn-outline">Về Trang Chủ</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dark-mode">
      <div className="bg-blob blob-1"></div>
      <div className="bg-blob blob-2"></div>
      <div className="bg-blob blob-3"></div>

      <div className="app-container" style={{ margin: '20px auto' }}>
        <div className="checkin-container glass">
          <div className="form-header">
            <span style={{ fontSize: '12px', color: 'var(--accent-violet)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Check-in sự kiện
            </span>
            <h2 style={{ marginTop: '6px' }}>{eventData.title}</h2>
            <p>Chia sẻ thông tin để kết nối cùng mọi người trong sự kiện.</p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Avatar Selector */}
            <div className="form-group avatar-group">
              <label>Chọn Ảnh Đại Diện (Avatar)</label>
              <div className="avatar-selector">
                {Object.keys(avatarPresets).map((key) => {
                  const av = avatarPresets[key];
                  return (
                    <div 
                      key={key}
                      className={`avatar-option ${avatar === key ? 'active' : ''}`} 
                      style={{ background: av.style }}
                      onClick={() => setAvatar(key)}
                    >
                      <i className={`fa-solid ${av.icon}`}></i>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Basic Info */}
            <div className="form-row">
              <div className="form-group col-6">
                <label>Họ tên / Nickname <span className="required">*</span></label>
                <div className="input-wrapper">
                  <i className="fa-solid fa-signature input-icon"></i>
                  <input 
                    type="text" 
                    placeholder="Ví dụ: Nguyễn Văn A (Tony)" 
                    value={fullname}
                    onChange={(e) => setFullname(e.target.value)}
                    required 
                  />
                </div>
              </div>

              <div className="form-group col-6">
                <label>Vai trò chính <span className="required">*</span></label>
                <div className="input-wrapper">
                  <i className="fa-solid fa-briefcase input-icon"></i>
                  <select value={role} onChange={(e) => setRole(e.target.value)} required>
                    <option value="" disabled>Chọn vai trò...</option>
                    <option value="Founder">Founder / Startup</option>
                    <option value="Developer">Developer / Coder</option>
                    <option value="Designer">UI/UX Designer</option>
                    <option value="Marketer">Marketing / Growth</option>
                    <option value="Investor">Nhà đầu tư (Investor)</option>
                    <option value="Other">Lĩnh vực khác</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Giới thiệu ngắn (Bio) <span className="required">*</span></label>
              <div className="input-wrapper">
                <i className="fa-solid fa-quote-left input-icon textarea-icon"></i>
                <textarea 
                  rows="2" 
                  maxLength="120" 
                  placeholder="1 dòng giới thiệu ngắn ấn tượng về bản thân (Tối đa 120 ký tự)..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  required
                ></textarea>
              </div>
            </div>

            {/* Icebreakers */}
            <div className="icebreaker-section">
              <h3 className="subsection-title"><i className="fa-solid fa-ice-cream"></i> Câu hỏi phá băng (Icebreaker)</h3>
              <div className="form-row">
                <div className="form-group col-6">
                  <label>Tôi đang tìm kiếm...</label>
                  <div className="input-wrapper">
                    <i className="fa-solid fa-magnifying-glass-plus input-icon"></i>
                    <input 
                      type="text" 
                      placeholder="Co-founder, Designer, Job mới..." 
                      value={looking}
                      onChange={(e) => setLooking(e.target.value)}
                    />
                  </div>
                </div>
                <div className="form-group col-6">
                  <label>Tôi có thể giúp bạn về...</label>
                  <div className="input-wrapper">
                    <i className="fa-solid fa-handshake-angle input-icon"></i>
                    <input 
                      type="text" 
                      placeholder="Tư vấn code, review UI, pitch deck..." 
                      value={help}
                      onChange={(e) => setHelp(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Contact details + Privacy */}
            <div className="contact-section">
              <h3 className="subsection-title">
                <span><i className="fa-solid fa-id-card"></i> Thông tin liên hệ & Quyền riêng tư</span>
                <span className="sub-label">Tích chọn bên phải để công khai thông tin</span>
              </h3>
              
              <div className="contact-grid">
                
                {/* Phone */}
                <div className="contact-input-row">
                  <div className="input-wrapper">
                    <i className="fa-solid fa-phone input-icon"></i>
                    <input 
                      type="tel" 
                      placeholder={`Số điện thoại / Zalo${eventData.require_phone ? ' *' : ''}`}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required={eventData.require_phone}
                    />
                  </div>
                  <label className="privacy-toggle">
                    <input type="checkbox" checked={sharePhone} onChange={(e) => setSharePhone(e.target.checked)} />
                    <span className="toggle-slider"></span>
                    <span className="toggle-text"><i className="fa-solid fa-eye"></i></span>
                  </label>
                </div>

                {/* Email */}
                <div className="contact-input-row">
                  <div className="input-wrapper">
                    <i className="fa-solid fa-envelope input-icon"></i>
                    <input 
                      type="email" 
                      placeholder="Email liên hệ" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <label className="privacy-toggle">
                    <input type="checkbox" checked={shareEmail} onChange={(e) => setShareEmail(e.target.checked)} />
                    <span className="toggle-slider"></span>
                    <span className="toggle-text"><i className="fa-solid fa-eye"></i></span>
                  </label>
                </div>

                {/* Telegram */}
                <div className="contact-input-row">
                  <div className="input-wrapper">
                    <i className="fa-brands fa-telegram input-icon"></i>
                    <input 
                      type="text" 
                      placeholder="Username Telegram (ví dụ: @username)" 
                      value={telegram}
                      onChange={(e) => setTelegram(e.target.value)}
                    />
                  </div>
                  <label className="privacy-toggle">
                    <input type="checkbox" checked={shareTelegram} onChange={(e) => setShareTelegram(e.target.checked)} />
                    <span className="toggle-slider"></span>
                    <span className="toggle-text"><i className="fa-solid fa-eye"></i></span>
                  </label>
                </div>

                {/* Facebook */}
                <div className="contact-input-row">
                  <div className="input-wrapper">
                    <i className="fa-brands fa-facebook input-icon"></i>
                    <input 
                      type="url" 
                      placeholder="Link Facebook cá nhân" 
                      value={facebook}
                      onChange={(e) => setFacebook(e.target.value)}
                    />
                  </div>
                  <label className="privacy-toggle">
                    <input type="checkbox" checked={shareFacebook} onChange={(e) => setShareFacebook(e.target.checked)} />
                    <span className="toggle-slider"></span>
                    <span className="toggle-text"><i className="fa-solid fa-eye"></i></span>
                  </label>
                </div>

                {/* LinkedIn */}
                <div className="contact-input-row">
                  <div className="input-wrapper">
                    <i className="fa-brands fa-linkedin input-icon"></i>
                    <input 
                      type="url" 
                      placeholder="Link LinkedIn" 
                      value={linkedin}
                      onChange={(e) => setLinkedin(e.target.value)}
                    />
                  </div>
                  <label className="privacy-toggle">
                    <input type="checkbox" checked={shareLinkedin} onChange={(e) => setShareLinkedin(e.target.checked)} />
                    <span className="toggle-slider"></span>
                    <span className="toggle-text"><i className="fa-solid fa-eye"></i></span>
                  </label>
                </div>

                {/* Instagram */}
                <div className="contact-input-row">
                  <div className="input-wrapper">
                    <i className="fa-brands fa-instagram input-icon"></i>
                    <input 
                      type="url" 
                      placeholder="Link Instagram" 
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                    />
                  </div>
                  <label className="privacy-toggle">
                    <input type="checkbox" checked={shareInstagram} onChange={(e) => setShareInstagram(e.target.checked)} />
                    <span className="toggle-slider"></span>
                    <span className="toggle-text"><i className="fa-solid fa-eye"></i></span>
                  </label>
                </div>

              </div>
            </div>

            {/* Action buttons */}
            <div className="form-actions">
              <Link to={`/directory/${slug}`} className="btn btn-outline" style={{ marginRight: 'auto' }}>
                <i className="fa-solid fa-chevron-left"></i> Xem Danh Bạ
              </Link>
              <button type="submit" className="btn btn-primary btn-glow" disabled={submitting}>
                {submitting ? (
                  <span><i className="fa-solid fa-spinner fa-spin"></i> Đang gửi...</span>
                ) : (
                  <span><i className="fa-solid fa-check"></i> Check-in & Tham Gia</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Toast Alert */}
      {toastMsg && (
        <div className="toast-container">
          <div className="toast success">{toastMsg}</div>
        </div>
      )}
    </div>
  );
}

export default GuestCheckin;
