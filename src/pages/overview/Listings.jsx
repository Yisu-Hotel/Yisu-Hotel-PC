import React, { useEffect, useMemo, useRef, useState } from 'react';
import CreateHotel from './CreateHotel';

const API_BASE = 'http://localhost:5050';
const PAGE_SIZE = 10;
const DEFAULT_IMAGE = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="640" height="420" viewBox="0 0 640 420"><rect width="640" height="420" fill="%23e2e8f0"/><path d="M180 280l90-110 90 110 60-70 110 130H180z" fill="%23cbd5f5"/><circle cx="420" cy="150" r="40" fill="%23cbd5f5"/></svg>';

const STATUS_OPTIONS = [
  { value: 'draft', label: '草稿', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400' },
  { value: 'pending', label: '待审核', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  { value: 'approved', label: '已通过', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  { value: 'rejected', label: '已拒绝', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' }
];

const resolveHotelImage = (hotel) => {
  const base64Images = hotel?.main_image_base64;
  if (Array.isArray(base64Images)) {
    const base64Image = base64Images.find((item) => typeof item === 'string' && item);
    if (base64Image) {
      return base64Image;
    }
  } else if (typeof base64Images === 'string' && base64Images) {
    return base64Images;
  }

  const images = hotel?.main_image_url;
  if (Array.isArray(images)) {
    const urlImage = images.find((item) => typeof item === 'string' && item);
    return urlImage || DEFAULT_IMAGE;
  }
  if (typeof images === 'string' && images) {
    return images;
  }
  return DEFAULT_IMAGE;
};

const formatLocation = (locationInfo = {}) => {
  const city = locationInfo.city || '';
  const address = locationInfo.formatted_address || locationInfo.street || locationInfo.district || '';
  return { city, address };
};

export default function Listings() {
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hotels, setHotels] = useState([]);
  const [statusOpen, setStatusOpen] = useState(false);
  const [selectedStatuses, setSelectedStatuses] = useState(() => STATUS_OPTIONS.map((item) => item.value));
  const [searchValue, setSearchValue] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const statusRef = useRef(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchValue.trim());
    }, 300);
    return () => clearTimeout(handler);
  }, [searchValue]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      setError('请先登录');
      return;
    }

    const fetchHotelPage = async (page, size) => {
      const response = await fetch(`${API_BASE}/hotel/list?page=${page}&size=${size}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const result = await response.json();
      if (!response.ok || result.code !== 0) {
        throw new Error(result.msg || '加载失败');
      }
      return result.data;
    };

    let isActive = true;
    setLoading(true);
    fetchHotelPage(1, 100)
      .then(async (firstPage) => {
        const total = firstPage.total || 0;
        const totalPages = Math.max(1, Math.ceil(total / 100));
        if (totalPages === 1) {
          return firstPage.list || [];
        }
        const restPages = await Promise.all(
          Array.from({ length: totalPages - 1 }).map((_, index) => fetchHotelPage(index + 2, 100))
        );
        const list = [firstPage.list || [], ...restPages.map((page) => page.list || [])].flat();
        return list;
      })
      .then((list) => {
        if (!isActive) {
          return;
        }
        setHotels(list || []);
        setError('');
      })
      .catch((fetchError) => {
        if (!isActive) {
          return;
        }
        setError(fetchError.message || '加载失败');
      })
      .finally(() => {
        if (isActive) {
          setLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedStatuses, debouncedSearch]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (statusRef.current && !statusRef.current.contains(event.target)) {
        setStatusOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredHotels = useMemo(() => {
    const keyword = debouncedSearch.toLowerCase();
    return (hotels || []).filter((hotel) => {
      const statusMatch = selectedStatuses.includes(hotel.status);
      if (!statusMatch) {
        return false;
      }
      if (!keyword) {
        return true;
      }
      const location = formatLocation(hotel.location_info);
      const haystack = [
        hotel.hotel_name_cn,
        hotel.hotel_name_en,
        location.city,
        location.address
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(keyword);
    });
  }, [hotels, selectedStatuses, debouncedSearch]);

  const totalPages = Math.max(1, Math.ceil(filteredHotels.length / PAGE_SIZE));
  const pageList = filteredHotels.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const statusLabel = selectedStatuses.length === STATUS_OPTIONS.length
    ? '全部状态'
    : STATUS_OPTIONS.filter((item) => selectedStatuses.includes(item.value)).map((item) => item.label).join(' / ');

  const handleStatusToggle = (value) => {
    setSelectedStatuses((prev) => {
      if (prev.includes(value)) {
        return prev.filter((item) => item !== value);
      }
      return [...prev, value];
    });
  };

  const handleSelectAllStatuses = () => {
    setSelectedStatuses(STATUS_OPTIONS.map((item) => item.value));
  };

  const handlePageChange = (nextPage) => {
    if (nextPage < 1 || nextPage > totalPages) {
      return;
    }
    setCurrentPage(nextPage);
  };

  const formatNumber = (value) => {
    const numberValue = Number(value) || 0;
    return new Intl.NumberFormat('zh-CN').format(numberValue);
  };

  if (isCreating) {
    return <CreateHotel onBack={() => setIsCreating(false)} />;
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-8 bg-background-light dark:bg-slate-950">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="sticky top-0 z-10 bg-background-light dark:bg-slate-950 pt-2">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap gap-4 items-center justify-between">
              <div className="relative w-full md:w-96">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                <input
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-primary focus:border-primary"
                  placeholder="搜索酒店名称或地点..."
                  type="text"
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                />
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm font-medium text-slate-500">状态筛选:</span>
                <div className="relative" ref={statusRef}>
                  <button
                    type="button"
                    className="text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-2 px-3 flex items-center gap-2"
                    onClick={() => setStatusOpen((prev) => !prev)}
                  >
                    <span className="text-slate-600 dark:text-slate-300">{statusLabel || '请选择状态'}</span>
                    <span className="material-symbols-outlined text-base">expand_more</span>
                  </button>
                  {statusOpen && (
                    <div className="absolute z-20 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg overflow-hidden">
                      <button
                        type="button"
                        className="w-full text-left px-4 py-2 text-sm font-semibold text-primary hover:bg-slate-50 dark:hover:bg-slate-800"
                        onClick={handleSelectAllStatuses}
                      >
                        全选
                      </button>
                      {STATUS_OPTIONS.map((item) => (
                        <label key={item.value} className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
                          <input
                            type="checkbox"
                            className="rounded text-primary"
                            checked={selectedStatuses.includes(item.value)}
                            onChange={() => handleStatusToggle(item.value)}
                          />
                          <span>{item.label}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                <button 
                  className="bg-primary hover:bg-primary/90 text-white px-5 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-lg shadow-primary/20 transition-all"
                  onClick={() => setIsCreating(true)}
                >
                  <span className="material-symbols-outlined text-lg">add</span>
                  添加新酒店
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-12 flex flex-col items-center justify-center text-slate-500">
                <span className="material-symbols-outlined text-4xl mb-3 animate-spin">autorenew</span>
                <p className="text-sm">正在加载酒店列表...</p>
              </div>
            ) : error ? (
              <div className="p-12 flex flex-col items-center justify-center text-rose-500">
                <span className="material-symbols-outlined text-4xl mb-3">error</span>
                <p className="text-sm">{error}</p>
              </div>
            ) : pageList.length === 0 ? (
              <div className="p-12 flex flex-col items-center justify-center text-slate-500">
                <span className="material-symbols-outlined text-4xl mb-3">sentiment_dissatisfied</span>
                <p className="text-sm">暂无符合条件的酒店</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
                        <th className="px-6 py-4">酒店信息</th>
                        <th className="px-6 py-4">地点</th>
                        <th className="px-6 py-4">状态</th>
                        <th className="px-6 py-4">预定量</th>
                        <th className="px-6 py-4 text-right">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {pageList.map((hotel) => {
                        const statusConfig = STATUS_OPTIONS.find((item) => item.value === hotel.status);
                        const location = formatLocation(hotel.location_info);
                        return (
                          <tr key={hotel.hotel_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
                                  <img alt={hotel.hotel_name_cn} className="w-full h-full object-cover" src={resolveHotelImage(hotel)} />
                                </div>
                                <div>
                                  <p className="font-bold text-slate-900 dark:text-white">{hotel.hotel_name_cn || '--'}</p>
                                  <p className="text-xs text-slate-500">{hotel.hotel_name_en || '--'}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-5 text-sm">
                              <p className="text-slate-700 dark:text-slate-300">{location.city || '--'}</p>
                              <p className="text-[10px] text-slate-500">{location.address || '--'}</p>
                            </td>
                            <td className="px-6 py-5">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${statusConfig?.color || 'bg-slate-100 text-slate-700'}`}>
                                <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5"></span>
                                {statusConfig?.label || '--'}
                              </span>
                            </td>
                            <td className="px-6 py-5">
                              <span className="text-sm font-bold text-slate-900 dark:text-white">{formatNumber(hotel.booking_count)}</span>
                            </td>
                            <td className="px-6 py-5 text-right">
                              <div className="flex items-center justify-end gap-3 text-sm font-semibold">
                                <button className="text-slate-500 hover:text-primary">编辑</button>
                                <button className="text-slate-500 hover:text-primary">查看详情</button>
                                <button className="text-slate-500 hover:text-rose-500">删除</button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <p className="text-sm text-slate-500">
                    显示第 <span className="font-semibold text-slate-700 dark:text-slate-300">{(currentPage - 1) * PAGE_SIZE + 1}</span> -
                    <span className="font-semibold text-slate-700 dark:text-slate-300"> {Math.min(currentPage * PAGE_SIZE, filteredHotels.length)}</span> 条，共
                    <span className="font-semibold text-slate-700 dark:text-slate-300"> {filteredHotels.length}</span> 条
                  </p>
                  <div className="flex gap-2">
                    <button
                      className={`px-3 py-1 border border-slate-200 dark:border-slate-700 rounded text-sm font-medium ${currentPage === 1 ? 'text-slate-400 cursor-not-allowed' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50'}`}
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      上一页
                    </button>
                    <button
                      className={`px-3 py-1 border border-slate-200 dark:border-slate-700 rounded text-sm font-medium ${currentPage === totalPages ? 'text-slate-400 cursor-not-allowed' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50'}`}
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      下一页
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
