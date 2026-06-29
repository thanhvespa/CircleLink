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

function EventDirectory() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [eventData, setEventData] = useState(null);
  const [attendeesList, setAttendeesList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [searchVal, setSearchVal] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [myCircleFilterActive, setMyCircleFilterActive] = useState(false);

  // Bookmarks (persisted per event in localStorage)
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set());

  // Modal details popup
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState('success');

  const showToast = (msg, type = 'success') => {
    setToastMsg(msg);
    setToastType(type);
    setTimeout(() => setToastMsg(''), 3000);
  };

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

      // Load bookmarks for this event slug
      const savedBookmarks = localStorage.getItem(`circlelink_bookmarks_${slug}`);
      if (savedBookmarks) {
        setBookmarkedIds(new Set(JSON.parse(savedBookmarks)));
      }

      const { data: list, error: listErr } = await eventService.getAttendees(event.id);
      if (!listErr && list) {
        setAttendeesList(list);
      }
      setLoading(false);
    }
    loadEventAndAttendees();
  }, [slug, navigate]);

  // Subscribe to realtime updates
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
        // Remove from local bookmarks too if deleted
        setBookmarkedIds(prev => {
          if (prev.has(deletedId)) {
            const next = new Set(prev);
            next.delete(deletedId);
            localStorage.setItem(`circlelink_bookmarks_${slug}`, JSON.stringify(Array.from(next)));
            return next;
          }
          return prev;
        });
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
  }, [eventData, slug]);

  const toggleBookmark = (id, name) => {
    setBookmarkedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        showToast(`💔 Đã xóa ${name} khỏi Vòng Tròn.`, 'heart');
      } else {
        next.add(id);
        showToast(`❤️ Đã thêm ${name} vào Vòng Tròn của bạn!`, 'heart');
      }
      localStorage.setItem(`circlelink_bookmarks_${slug}`, JSON.stringify(Array.from(next)));
      return next;
    });
  };

  const downloadVCard = (guest) => {
    const sharedPhone = guest.privacy?.phone ? guest.contacts?.phone : '';
    const sharedEmail = guest.privacy?.email ? guest.contacts?.email : '';
    const sharedFb = guest.privacy?.facebook ? guest.contacts?.facebook : '';
    const sharedIn = guest.privacy?.linkedin ? guest.contacts?.linkedin : '';
    const sharedTg = guest.privacy?.telegram ? guest.contacts?.telegram : '';

    const notes = [
      `Bio: ${guest.bio}`,
      `Looking for: ${guest.looking}`,
      `Can help with: ${guest.help}`,
      sharedTg ? `Telegram: ${sharedTg}` : ''
    ].filter(Boolean).join(' \\n ');

    let vcard = 'BEGIN:VCARD\r\n';
    vcard += 'VERSION:3.0\r\n';
    vcard += `FN:${guest.name}\r\n`;
    vcard += `ORG:CircleLink - ${guest.role}\r\n`;
    vcard += `TITLE:${guest.role}\r\n`;
    vcard += `NOTE:${notes}\r\n`;

    if (sharedPhone) vcard += `TEL;TYPE=CELL,VOICE:${sharedPhone}\r\n`;
    if (sharedEmail) vcard += `EMAIL;TYPE=PREF,INTERNET:${sharedEmail}\r\n`;
    if (sharedFb) vcard += `URL;TYPE=Facebook:${sharedFb}\r\n`;
    if (sharedIn) vcard += `URL;TYPE=LinkedIn:${sharedIn}\r\n`;

    vcard += 'END:VCARD';

    const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8;' });
    const filename = `${guest.name.replace(/\s+/g, '_')}_contact.vcf`;

    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`💾 Đã tải file vCard danh bạ của ${guest.name}.`, 'success');
  };

  const downloadBulkVCards = () => {
    if (filteredAttendees.length === 0) return;

    let combinedVCard = '';
    filteredAttendees.forEach((guest) => {
      const sharedPhone = guest.privacy?.phone ? guest.contacts?.phone : '';
      const sharedEmail = guest.privacy?.email ? guest.contacts?.email : '';
      const sharedFb = guest.privacy?.facebook ? guest.contacts?.facebook : '';
      const sharedIn = guest.privacy?.linkedin ? guest.contacts?.linkedin : '';
      const sharedTg = guest.privacy?.telegram ? guest.contacts?.telegram : '';

      const notes = [
        `Bio: ${guest.bio}`,
        `Looking for: ${guest.looking}`,
        `Can help with: ${guest.help}`,
        sharedTg ? `Telegram: ${sharedTg}` : ''
      ].filter(Boolean).join(' \\n ');

      combinedVCard += 'BEGIN:VCARD\r\n';
      combinedVCard += 'VERSION:3.0\r\n';
      combinedVCard += `FN:${guest.name}\r\n`;
      combinedVCard += `ORG:CircleLink - ${guest.role}\r\n`;
      combinedVCard += `TITLE:${guest.role}\r\n`;
      combinedVCard += `NOTE:${notes}\r\n`;

      if (sharedPhone) combinedVCard += `TEL;TYPE=CELL,VOICE:${sharedPhone}\r\n`;
      if (sharedEmail) combinedVCard += `EMAIL;TYPE=PREF,INTERNET:${sharedEmail}\r\n`;
      if (sharedFb) combinedVCard += `URL;TYPE=Facebook:${sharedFb}\r\n`;
      if (sharedIn) combinedVCard += `URL;TYPE=LinkedIn:${sharedIn}\r\n`;

      combinedVCard += 'END:VCARD\r\n';
    });

    const blob = new Blob([combinedVCard], { type: 'text/vcard;charset=utf-8;' });
    const typeLabel = myCircleFilterActive ? 'Circle' : 'All';
    const filename = `CircleLink_${slug}_${typeLabel}_${filteredAttendees.length}.vcf`;

    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`💾 Đã tải bộ danh bạ ${filteredAttendees.length} thành viên!`, 'success');
  };

  const openModal = (guest) => {
    setSelectedGuest(guest);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--text-secondary)' }}>
        <h3><i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '10px' }}></i> Đang mở sổ danh bạ...</h3>
      </div>
    );
  }

  // Client filter
  const filteredAttendees = attendeesList.filter(guest => {
    if (roleFilter !== 'all' && guest.role !== roleFilter) return false;
    if (myCircleFilterActive && !bookmarkedIds.has(guest.id)) return false;

    if (searchVal) {
      const s = searchVal.toLowerCase();
      return (
        guest.name.toLowerCase().includes(s) ||
        guest.bio.toLowerCase().includes(s) ||
        guest.looking.toLowerCase().includes(s) ||
        guest.help.toLowerCase().includes(s) ||
        guest.role.toLowerCase().includes(s)
      );
    }
    return true;
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
          <div style={{ display: 'flex', gap: '12px' }}>
            <Link to={`/checkin/${slug}`} className="btn btn-outline" style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '20px' }}>
              <i className="fa-solid fa-user-plus"></i> Check-in Form
            </Link>
          </div>
        </div>
      </header>

      <main className="app-container">
        
        {/* Search & Filters */}
        <div className="directory-control-panel glass">
          <div className="search-box">
            <i className="fa-solid fa-magnifying-glass search-icon"></i>
            <input 
              type="text" 
              placeholder="Tìm kiếm theo tên, bio, vai trò, icebreaker..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
            />
            {searchVal && (
              <button className="clear-search-btn" style={{ display: 'block' }} onClick={() => setSearchVal('')}>
                <i className="fa-solid fa-circle-xmark"></i>
              </button>
            )}
          </div>

          <div className="quick-suggestions">
            <span style={{ color: 'var(--text-muted)' }}><i className="fa-solid fa-tags"></i> Gợi ý tìm kiếm:</span>
            {[
              { label: 'Tìm Co-founder', query: 'co-founder' },
              { label: 'Tìm Developer', query: 'developer' },
              { label: 'Tìm Designer', query: 'designer' },
              { label: 'Tìm Nhà đầu tư', query: 'investor' },
              { label: 'Tìm Mentor', query: 'mentor' }
            ].map((item) => (
              <button 
                key={item.label}
                className="quick-suggest-btn"
                onClick={() => setSearchVal(item.query)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="filters-row">
            <div className="role-filters">
              {['all', 'Founder', 'Developer', 'Designer', 'Marketer', 'Investor', 'Other'].map((r) => (
                <button 
                  key={r}
                  className={`filter-chip ${roleFilter === r ? 'active' : ''}`}
                  onClick={() => setRoleFilter(r)}
                >
                  {r === 'all' ? 'Tất cả' : r}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button 
                className={`btn-circle-toggle ${myCircleFilterActive ? 'active' : ''}`}
                onClick={() => setMyCircleFilterActive(!myCircleFilterActive)}
              >
                <i className="fa-solid fa-heart"></i>
                <span>Vòng Tròn Của Tôi</span>
              </button>

              <button 
                className="btn btn-outline btn-download-all"
                onClick={downloadBulkVCards}
                disabled={filteredAttendees.length === 0}
                style={{
                  borderRadius: '20px',
                  padding: '8px 16px',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  height: '36px',
                  border: '1px solid var(--border-color)',
                  background: 'rgba(255, 255, 255, 0.03)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)'
                }}
              >
                <i className="fa-solid fa-file-arrow-down"></i>
                <span>Xuất {myCircleFilterActive ? 'Circle' : 'Tất cả'} ({filteredAttendees.length})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Directory Grid */}
        <div className="directory-grid">
          {filteredAttendees.length > 0 ? (
            filteredAttendees.map((guest) => {
              const av = avatarPresets[guest.avatar] || avatarPresets['avatar-1'];
              const isBookmarked = bookmarkedIds.has(guest.id);
              
              // Build shared contact indicators
              const shareable = [
                { key: 'phone', icon: 'fa-phone' },
                { key: 'email', icon: 'fa-envelope' },
                { key: 'telegram', icon: 'fa-telegram' },
                { key: 'facebook', icon: 'fa-facebook' },
                { key: 'linkedin', icon: 'fa-linkedin' },
                { key: 'instagram', icon: 'fa-instagram' }
              ];
              const sharedCount = shareable.filter(c => guest.contacts?.[c.key] && guest.privacy?.[c.key]);

              return (
                <div key={guest.id} className="profile-card glass" onClick={() => openModal(guest)}>
                  <button 
                    className={`bookmark-btn ${isBookmarked ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleBookmark(guest.id, guest.name);
                    }}
                  >
                    <i className={isBookmarked ? 'fa-solid fa-heart active' : 'fa-regular fa-heart'}></i>
                  </button>

                  <div className="card-header-row">
                    <div className="card-avatar" style={{ background: av.style }}>
                      <i className={`fa-solid ${av.icon}`}></i>
                    </div>
                    <div className="card-identity">
                      <span className={`role-badge ${guest.role.toLowerCase()}`}>{guest.role}</span>
                      <span className="card-name">{guest.name}</span>
                    </div>
                  </div>

                  <p className="card-bio">{guest.bio}</p>

                  <div className="card-icebreakers">
                    <div className="card-icebreaker-item">
                      <span className="lbl">Tìm:</span>
                      <span className="val" title={guest.looking}>{guest.looking}</span>
                    </div>
                    <div className="card-icebreaker-item">
                      <span className="lbl">Giúp:</span>
                      <span className="val" title={guest.help}>{guest.help}</span>
                    </div>
                  </div>

                  <div className="card-footer-row">
                    <div className="card-contact-indicators">
                      {sharedCount.length > 0 ? (
                        sharedCount.map(c => (
                          <i key={c.key} className={`fa-solid ${c.icon} active`} title={`${c.key.toUpperCase()} Shared`}></i>
                        ))
                      ) : (
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Không công khai</span>
                      )}
                    </div>
                    <button 
                      className="card-vcard-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadVCard(guest);
                      }}
                    >
                      <i className="fa-solid fa-file-invoice"></i> vCard
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="empty-directory" style={{ gridColumn: 'span 4' }}>
              <i className="fa-solid fa-address-book"></i>
              <h3>Không tìm thấy thành viên nào</h3>
              <p>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm để tìm cộng sự.</p>
            </div>
          )}
        </div>

      </main>

      {/* Profile Detail Modal */}
      {modalOpen && selectedGuest && (() => {
        const av = avatarPresets[selectedGuest.avatar] || avatarPresets['avatar-1'];
        const isBookmarked = bookmarkedIds.has(selectedGuest.id);
        const contactDefs = [
          { key: 'phone', title: 'Điện thoại/Zalo', icon: 'fa-phone', class: 'phone-link', prefix: 'tel:' },
          { key: 'email', title: 'Email', icon: 'fa-envelope', class: 'email-link', prefix: 'mailto:' },
          { key: 'telegram', title: 'Telegram', icon: 'fa-telegram', class: 'tg-link', prefix: 'https://t.me/' },
          { key: 'facebook', title: 'Facebook', icon: 'fa-facebook', class: 'fb-link', prefix: '' },
          { key: 'linkedin', title: 'LinkedIn', icon: 'fa-linkedin', class: 'in-link', prefix: '' },
          { key: 'instagram', title: 'Instagram', icon: 'fa-instagram', class: 'ig-link', prefix: '' }
        ];
        const sharedContacts = contactDefs.filter(def => selectedGuest.contacts?.[def.key] && selectedGuest.privacy?.[def.key]);

        return (
          <div className="modal-overlay active" onClick={closeModal}>
            <div className="modal-card glass" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close" onClick={closeModal}>&times;</button>
              
              <div className="modal-header-content">
                <div className="modal-avatar" style={{ background: av.style }}>
                  <i className={`fa-solid ${av.icon}`}></i>
                </div>
                <div className="modal-basic-info">
                  <span className={`role-badge ${selectedGuest.role.toLowerCase()}`}>{selectedGuest.role}</span>
                  <h2>{selectedGuest.name}</h2>
                  <p className="modal-bio">"{selectedGuest.bio}"</p>
                </div>
              </div>

              <div className="modal-body">
                <div className="modal-icebreakers">
                  <div className="icebreaker-box looking">
                    <div className="title"><i className="fa-solid fa-magnifying-glass"></i> Đang tìm kiếm</div>
                    <div className="text">{selectedGuest.looking}</div>
                  </div>
                  <div className="icebreaker-box offering">
                    <div className="title"><i className="fa-solid fa-circle-nodes"></i> Có thể giúp đỡ</div>
                    <div className="text">{selectedGuest.help}</div>
                  </div>
                </div>

                <div className="modal-contacts">
                  <h3>Thông tin liên hệ được chia sẻ</h3>
                  <div className="contact-links-grid">
                    {sharedContacts.length > 0 ? (
                      sharedContacts.map(def => {
                        const val = selectedGuest.contacts[def.key];
                        let url = val;
                        if (def.prefix) {
                          if (def.key === 'telegram') {
                            url = def.prefix + (val.startsWith('@') ? val.substring(1) : val);
                          } else {
                            url = def.prefix + val;
                          }
                        }
                        return (
                          <a key={def.key} href={url} target="_blank" rel="noopener noreferrer" className={`btn-contact-link ${def.class}`}>
                            <i className={`fa-solid ${def.icon}`}></i>
                            <span>{def.title}: {val}</span>
                          </a>
                        );
                      })
                    ) : (
                      <div style={{ gridColumn: 'span 2', textAlign: 'center', color: 'var(--text-muted)', padding: '20px 0' }}>
                        <i className="fa-solid fa-lock" style={{ fontSize: '20px', display: 'block', marginBottom: '8px' }}></i>
                        Thành viên này chọn không chia sẻ công khai các kênh liên lạc.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  className={`btn btn-outline ${isBookmarked ? 'active' : ''}`}
                  style={isBookmarked ? { color: 'var(--accent-pink)', borderColor: 'rgba(236, 72, 153, 0.4)' } : {}}
                  onClick={() => toggleBookmark(selectedGuest.id, selectedGuest.name)}
                >
                  <i className={isBookmarked ? 'fa-solid fa-heart' : 'fa-regular fa-heart'}></i>
                  {isBookmarked ? ' Đã Lưu vào Circle' : ' Lưu vào Circle'}
                </button>
                <button className="btn btn-primary" onClick={() => downloadVCard(selectedGuest)}>
                  <i className="fa-solid fa-download"></i> vCard (Danh bạ)
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Toast Alert */}
      {toastMsg && (
        <div className="toast-container">
          <div className={`toast ${toastType}`}>
            {toastMsg}
          </div>
        </div>
      )}
    </div>
  );
}

export default EventDirectory;
