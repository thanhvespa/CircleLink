import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventService } from '../services/eventService';

function Home() {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [slug, setSlug] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Helper to dynamically slugify title while typing if slug is empty
  const handleTitleChange = (e) => {
    const val = e.target.value;
    setTitle(val);
    
    // Auto slugify if slug hasn't been manually edited or is empty
    const slugified = val
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove tone marks (Vietnamese)
      .replace(/[đĐ]/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    setSlug(slugified);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !slug) return;

    setLoading(true);
    setError('');

    const cleanSlug = slug.trim().toLowerCase();
    const { data, error: serviceError } = await eventService.createEvent(cleanSlug, title.trim(), desc.trim());

    setLoading(false);

    if (serviceError) {
      setError(serviceError.message || 'Đã có lỗi xảy ra khi tạo sự kiện.');
    } else if (data) {
      // Event created successfully! Route to Host Admin Dashboard
      navigate(`/event/${data.slug}/admin`);
    }
  };

  return (
    <div className="dark-mode">
      {/* Background blobs */}
      <div className="bg-blob blob-1"></div>
      <div className="bg-blob blob-2"></div>
      <div className="bg-blob blob-3"></div>

      <div className="home-container">
        <header className="hero-section">
          <div className="logo" style={{ justifyContent: 'center', marginBottom: '20px' }}>
            <div className="logo-icon">L</div>
            <span className="logo-text">Circle<span>Link</span></span>
          </div>
          <h1 className="hero-title">Mở Rộng <span>Vòng Tròn</span> Kết Nối</h1>
          <p className="hero-subtitle">
            Giải pháp check-in, share profile thời gian thực và quản lý danh bạ sự kiện offline chuyên nghiệp.
          </p>
        </header>

        <main className="home-actions-card glass">
          <h3><i className="fa-solid fa-square-plus" style={{ color: 'var(--accent-violet)', marginRight: '8px' }}></i> Tạo sự kiện mới của bạn</h3>
          
          {error && (
            <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', marginBottom: '20px', textAlign: 'left' }}>
              <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: '8px' }}></i> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group-home">
              <label>Tên sự kiện <span className="required">*</span></label>
              <div className="input-wrapper">
                <i className="fa-solid fa-heading input-icon"></i>
                <input 
                  type="text" 
                  placeholder="Ví dụ: AI Meetup Hà Nội #1" 
                  value={title} 
                  onChange={handleTitleChange} 
                  required 
                />
              </div>
            </div>

            <div className="form-group-home">
              <label>Mô tả sự kiện</label>
              <div className="input-wrapper">
                <i className="fa-solid fa-align-left input-icon"></i>
                <input 
                  type="text" 
                  placeholder="Ví dụ: Giao lưu, chia sẻ công nghệ & kết nối..." 
                  value={desc} 
                  onChange={(e) => setDesc(e.target.value)} 
                />
              </div>
            </div>

            <div className="form-group-home">
              <label>Đường dẫn sự kiện (slug) <span className="required">*</span></label>
              <div className="input-wrapper">
                <i className="fa-solid fa-link input-icon"></i>
                <input 
                  type="text" 
                  placeholder="url-su-kien" 
                  value={slug} 
                  onChange={(e) => setSlug(e.target.value.replace(/\s+/g, '-'))} 
                  required 
                />
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'left', display: 'block', marginTop: '4px' }}>
                Đường dẫn sẽ có dạng: http://localhost:8000/#/checkin/<strong>{slug || 'url-cua-ban'}</strong>
              </span>
            </div>

            <button type="submit" className="btn btn-primary btn-glow" style={{ width: '100%', marginTop: '10px' }} disabled={loading}>
              {loading ? (
                <span><i className="fa-solid fa-spinner fa-spin"></i> Đang tạo...</span>
              ) : (
                <span><i className="fa-solid fa-rocket"></i> Tạo Sự Kiện & Trình Chiếu</span>
              )}
            </button>
          </form>
        </main>

        <section className="home-features-grid">
          <div className="feature-card glass">
            <div className="feature-icon">
              <i className="fa-solid fa-qrcode"></i>
            </div>
            <h4>Check-in Web-first</h4>
            <p>Khách mời chỉ cần quét mã QR bằng camera điện thoại để điền profile cá nhân. Không cần tải app.</p>
          </div>

          <div className="feature-card glass">
            <div className="feature-icon">
              <i className="fa-solid fa-address-card"></i>
            </div>
            <h4>Danh bạ sự kiện Realtime</h4>
            <p>Toàn bộ danh sách người tham gia được đồng bộ thời gian thực, cho phép tìm kiếm, lọc theo vai trò kỹ năng.</p>
          </div>

          <div className="feature-card glass">
            <div className="feature-icon">
              <i className="fa-solid fa-file-arrow-download"></i>
            </div>
            <h4>Lưu vCard 1-Click</h4>
            <p>Người tham gia dễ dàng xuất thông tin liên hệ của nhau thành file danh bạ điện thoại để lưu trữ trực tiếp.</p>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Home;
