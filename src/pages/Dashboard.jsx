import React, { useState } from 'react';

const DEFAULT_IMAGE = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="640" height="420" viewBox="0 0 640 420"><rect width="640" height="420" fill="%23e2e8f0"/><path d="M180 280l90-110 90 110 60-70 110 130H180z" fill="%23cbd5f5"/><circle cx="420" cy="150" r="40" fill="%23cbd5f5"/></svg>';

const StatCard = ({ title, value, icon, loading }) => (
  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">{icon}</div>
    </div>
    <p className="text-slate-500 text-sm font-medium">{title}</p>
    {loading ? (
      <div className="mt-2 h-8 w-24 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse" />
    ) : (
      <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{value}</h3>
    )}
  </div>
);

const SkeletonCard = () => (
  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-pulse">
    <div className="h-40 bg-slate-200 dark:bg-slate-700" />
    <div className="p-5 space-y-3">
      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
      <div className="grid grid-cols-4 gap-3">
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded" />
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded" />
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded" />
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded" />
      </div>
    </div>
  </div>
);

const statusBadgeStyle = (status) => {
  if (status === 'pending') {
    return 'bg-amber-500 text-white';
  }
  if (status === 'approved') {
    return 'bg-emerald-500 text-white';
  }
  if (status === 'rejected') {
    return 'bg-rose-500 text-white';
  }
  if (status === 'draft') {
    return 'bg-slate-500 text-white';
  }
  return 'bg-slate-400 text-white';
};

const resolveHotelImage = (hotel) => {
  const images = hotel?.main_image_url;
  if (Array.isArray(images)) {
    const base64Image = images.find((item) => typeof item === 'string' && item.startsWith('data:image'));
    if (base64Image) {
      return base64Image;
    }
    const urlImage = images.find((item) => typeof item === 'string' && item);
    return urlImage || DEFAULT_IMAGE;
  }
  if (typeof images === 'string' && images) {
    return images;
  }
  return DEFAULT_IMAGE;
};

const HotelGrid = ({ hotels, loading, onImageError, onViewDetail }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonCard key={`skeleton-${index}`} />
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
      {(hotels || []).map((hotel) => (
        <div
          key={hotel.hotel_id}
          className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm group hover:shadow-md transition-all relative"
        >
          <div className="relative h-40">
            <img
              alt={hotel.hotel_name_cn}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
              src={resolveHotelImage(hotel)}
              loading="lazy"
              onError={onImageError}
            />
            <div className="absolute top-3 right-3">
              <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider shadow-sm ${statusBadgeStyle(hotel.status)}`}>
                {hotel.status || '--'}
              </span>
            </div>
            <button
              type="button"
              className="absolute inset-0 flex items-center justify-center bg-black/40 text-white text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => onViewDetail(hotel)}
            >
              查看详情
            </button>
          </div>
          <div className="p-5">
            <div className="flex justify-between items-start mb-3">
              <h4 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                {hotel.hotel_name_cn}
              </h4>
            </div>
            <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
              <div className="flex flex-col items-center">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{hotel.booking_count}</span>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Bookings</span>
              </div>
              <div className="flex flex-col items-center border-l border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{hotel.favorite_count}</span>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Saves</span>
              </div>
              <div className="flex flex-col items-center border-l border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{hotel.average_rating}</span>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Rating</span>
              </div>
              <div className="flex flex-col items-center border-l border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{hotel.review_count}</span>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Reviews</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default function Dashboard({
  stats,
  previewHotels,
  allHotels,
  loading,
  error,
  isViewAll,
  onViewAll,
  onBack,
  onImageError
}) {
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const handleViewDetail = (hotel) => {
    setSelectedHotel(hotel);
  };

  const handleCloseDetail = () => {
    setSelectedHotel(null);
  };

  const handleOpenChat = () => {
    setIsChatOpen(true);
  };

  const handleCloseChat = () => {
    setIsChatOpen(false);
  };

  const detailModal = selectedHotel ? (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={handleCloseDetail}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">酒店详情</p>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
              {selectedHotel.hotel_name_cn || '未命名酒店'}
            </h4>
          </div>
          <button
            type="button"
            className="text-sm font-semibold text-slate-500 hover:text-primary"
            onClick={handleCloseDetail}
          >
            关闭
          </button>
        </div>
        <div className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
          <p>内容待定</p>
          <p>酒店ID：{selectedHotel.hotel_id || '--'}</p>
        </div>
      </div>
    </div>
  ) : null;

  const chatPanel = isChatOpen ? (
    <div className="fixed inset-0 z-50">
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={handleCloseChat}
      />
      <aside className="fixed right-0 top-0 bottom-0 w-full max-w-[400px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col shadow-2xl">
        <header className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-primary text-sm font-bold">
              AI
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white leading-tight">EasyStay AI Assistant</h3>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Always Online</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            onClick={handleCloseChat}
          >
            关闭
          </button>
        </header>
        <div className="flex-1 overflow-y-auto" />
      </aside>
    </div>
  ) : null;

  if (isViewAll) {
    return (
      <>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <button className="hover:text-primary" onClick={onBack}>Dashboard</button>
            <span>/</span>
            <span className="text-slate-700 dark:text-slate-200">View All Properties</span>
          </div>
          <button
            className="text-sm font-semibold text-primary hover:underline"
            onClick={onBack}
          >
            返回概览
          </button>
        </div>
        <HotelGrid
          hotels={allHotels || []}
          loading={loading}
          onImageError={onImageError}
          onViewDetail={handleViewDetail}
        />
        {detailModal}
        {chatPanel}
      </>
    );
  }

  return (
    <>
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="总收藏量"
          value={error ? '--' : stats.totalFavorites}
          loading={loading}
          icon={(
            <svg className="h-5 w-5 text-rose-500" viewBox="0 0 24 24" fill="none">
              <path d="M12 20s-7-4.5-7-9.5A4.5 4.5 0 0 1 9.5 6c1.1 0 2.2.4 3 1.2A4.2 4.2 0 0 1 15.5 6 4.5 4.5 0 0 1 20 10.5C20 15.5 12 20 12 20Z" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          )}
        />
        <StatCard
          title="总预订"
          value={error ? '--' : stats.totalBookings}
          loading={loading}
          icon={(
            <svg className="h-5 w-5 text-indigo-500" viewBox="0 0 24 24" fill="none">
              <path d="M7 3v4M17 3v4M4 9h16M5 6h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.6" />
              <path d="M8 13h4M8 17h7" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          )}
        />
        <StatCard
          title="总酒店数"
          value={error ? '--' : stats.totalHotels}
          loading={loading}
          icon={(
            <svg className="h-5 w-5 text-emerald-500" viewBox="0 0 24 24" fill="none">
              <path d="M4 20V7l8-4 8 4v13H4Z" stroke="currentColor" strokeWidth="1.6" />
              <path d="M9 20v-6h6v6" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          )}
        />
        <StatCard
          title="已通过审核"
          value={error ? '--' : stats.approvedHotels}
          loading={loading}
          icon={(
            <svg className="h-5 w-5 text-amber-500" viewBox="0 0 24 24" fill="none">
              <path d="M12 3 20 6v6c0 4.4-3 7.7-8 9-5-1.3-8-4.6-8-9V6l8-3Z" stroke="currentColor" strokeWidth="1.6" />
              <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          )}
        />
      </section>

      <section>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white">Property Overview</h3>
          <button
            className="text-primary text-sm font-bold flex items-center gap-1 hover:underline"
            onClick={onViewAll}
          >
            View All Properties
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
              <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          </button>
        </div>

        <HotelGrid
          hotels={previewHotels}
          loading={loading}
          onImageError={onImageError}
          onViewDetail={handleViewDetail}
        />
      </section>

      <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-primary/20 p-3 rounded-full">
            <svg className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none">
              <path d="M6 17h5l2 3h5V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2Z" stroke="currentColor" strokeWidth="1.6" />
              <path d="M8 9h6M8 12h4" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800 dark:text-white leading-tight">智能客服中心</p>
            <p className="text-xs text-slate-500">提供平台咨询、审核问题与账单支持的即时协助。</p>
          </div>
        </div>
        <div>
          <button
            className="px-4 py-2 text-sm font-bold text-white bg-primary rounded-lg hover:bg-primary/90 shadow-md shadow-primary/20 transition-all"
            onClick={handleOpenChat}
          >
            Chat Now
          </button>
        </div>
      </div>
      {detailModal}
      {chatPanel}
    </>
  );
}
