import React, { useEffect, useMemo, useState } from 'react';

const API_BASE = 'http://localhost:5050';

const tabs = [
  { key: 'online', label: '已上线列表' },
  { key: 'offline', label: '被下线列表' }
];

const STATUS_OPTIONS = [
  { value: 'pending', label: '待审核', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  { value: 'auditing', label: '审核中', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  { value: 'approved', label: '已通过', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  { value: 'rejected', label: '已拒绝', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' }
];

const formatLocation = (locationInfo = {}) => {
  const city = locationInfo.city || '';
  const district = locationInfo.district || '';
  const address = locationInfo.formatted_address || locationInfo.street || '';
  return { city, district, address };
};

const formatDateTime = (value) => {
  if (!value) {
    return '--';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString('zh-CN', { hour12: false });
};

export default function Listings() {
  const [activeTab, setActiveTab] = useState('online');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hotels, setHotels] = useState([]);

  const handleViewDetails = (hotel) => {
    console.log('View details:', hotel);
  };

  const handleTakeOffline = (hotel) => {
    console.log('Take offline:', hotel);
  };

  const handleBringOnline = (hotel) => {
    console.log('Bring online:', hotel);
  };

  const list = useMemo(
    () => hotels,
    [hotels]
  );

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('请先登录');
      setHotels([]);
      return;
    }

    const status = activeTab === 'online' ? 'approved' : 'rejected';
    let isActive = true;
    setLoading(true);
    setError('');

    fetch(`${API_BASE}/admin/hotel/audit-list?page=1&page_size=50&status=${status}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok || result.code !== 0) {
          throw new Error(result.msg || '加载失败');
        }
        return result.data;
      })
      .then((data) => {
        if (!isActive) {
          return;
        }
        setHotels(Array.isArray(data?.list) ? data.list : []);
      })
      .catch((fetchError) => {
        if (!isActive) {
          return;
        }
        setError(fetchError.message || '加载失败');
        setHotels([]);
      })
      .finally(() => {
        if (isActive) {
          setLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [activeTab]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">酒店上架管理</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">查看已上线与被下线的酒店列表。</p>
          </div>
          <div className="inline-flex rounded-full bg-slate-100 dark:bg-slate-800 p-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 text-sm font-semibold rounded-full transition-all ${
                  activeTab === tab.key
                    ? 'bg-white dark:bg-slate-900 text-primary shadow'
                    : 'text-slate-500 hover:text-primary'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6">
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
          ) : list.length === 0 ? (
            <div className="p-12 flex flex-col items-center justify-center text-slate-500">
              <span className="material-symbols-outlined text-4xl mb-3">sentiment_dissatisfied</span>
              <p className="text-sm">暂无符合条件的酒店</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
                    <th className="px-6 py-4">酒店信息</th>
                    <th className="px-6 py-4">地点</th>
                    <th className="px-6 py-4">状态</th>
                    <th className="px-6 py-4">提交信息</th>
                    <th className="px-6 py-4 text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {list.map((hotel) => {
                    const statusConfig = STATUS_OPTIONS.find((item) => item.value === hotel.status);
                    const location = formatLocation(hotel.location_info);
                    return (
                      <tr key={hotel.hotel_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-5">
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">{hotel.hotel_name_cn || '--'}</p>
                            <p className="text-xs text-slate-500">{hotel.hotel_name_en || '--'}</p>
                            <p className="text-[10px] text-slate-400 mt-1">{hotel.hotel_id || '--'}</p>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-sm">
                          <p className="text-slate-700 dark:text-slate-300">{location.city || '--'} {location.district || ''}</p>
                          <p className="text-[10px] text-slate-500">{location.address || '--'}</p>
                        </td>
                        <td className="px-6 py-5">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${statusConfig?.color || 'bg-slate-100 text-slate-700'}`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5"></span>
                            {hotel.status_text || statusConfig?.label || '--'}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-sm text-slate-600 dark:text-slate-300">
                          <p>{formatDateTime(hotel.submitted_at)}</p>
                          <p className="text-[10px] text-slate-500">{hotel.submitted_by || '--'}</p>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex items-center justify-end gap-3 text-sm font-semibold">
                            <button onClick={() => handleViewDetails(hotel)} className="text-slate-500 hover:text-primary">查看详情</button>
                            {activeTab === 'online' ? (
                              <button onClick={() => handleTakeOffline(hotel)} className="text-slate-500 hover:text-rose-500">下线</button>
                            ) : (
                              <button onClick={() => handleBringOnline(hotel)} className="text-slate-500 hover:text-emerald-500">重新上线</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
