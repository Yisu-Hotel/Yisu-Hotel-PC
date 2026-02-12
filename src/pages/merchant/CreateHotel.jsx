import React, { useEffect, useMemo, useState } from 'react';

const API_BASE = 'http://localhost:5050';
const DEFAULT_IMAGE = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="640" height="420" viewBox="0 0 640 420"><rect width="640" height="420" fill="%23e2e8f0"/><path d="M180 280l90-110 90 110 60-70 110 130H180z" fill="%23cbd5f5"/><circle cx="420" cy="150" r="40" fill="%23cbd5f5"/></svg>';

const FACILITIES_OPTIONS = [
  { id: 'wifi', name: '免费WiFi' },
  { id: 'parking', name: '免费停车场' },
  { id: 'air_conditioner', name: '空调' },
  { id: 'tv', name: '电视' },
  { id: 'breakfast', name: '早餐' },
  { id: 'gym', name: '健身房' },
  { id: 'pool', name: '游泳池' },
  { id: 'spa', name: 'SPA' }
];

const SERVICES_OPTIONS = [
  { id: 'reception', name: '24小时前台' },
  { id: 'luggage', name: '行李寄存' },
  { id: 'laundry', name: '洗衣服务' },
  { id: 'taxi', name: '叫车服务' },
  { id: 'concierge', name: '礼宾服务' },
  { id: 'room_service', name: '客房服务' },
  { id: 'wakeup', name: '叫醒服务' }
];

const ROOM_FACILITIES_OPTIONS = [
  { id: 'free_wifi', name: '免费WiFi' },
  { id: 'air_conditioner', name: '空调' },
  { id: 'tv', name: '平板电视' },
  { id: 'minibar', name: '迷你吧' },
  { id: 'bathtub', name: '浴缸' },
  { id: 'workdesk', name: '办公桌' },
  { id: 'sofa', name: '沙发' },
  { id: 'hairdryer', name: '吹风机' }
];

const ROOM_SERVICES_OPTIONS = [
  { id: 'room_service', name: '24小时客房服务' },
  { id: 'laundry', name: '洗衣服务' },
  { id: 'airport_transfer', name: '机场接送' },
  { id: 'butler', name: '管家服务' }
];

export default function CreateHotel({ onBack, hotelId, initialData }) {
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeSection, setActiveSection] = useState('general'); // general, facilities, rooms
  const isEditMode = Boolean(hotelId);

  // General Info State
  const [generalInfo, setGeneralInfo] = useState({
    hotel_name_cn: '',
    hotel_name_en: '',
    star_rating: 3,
    description: '',
    phone: '',
    opening_date: new Date().toISOString().split('T')[0],
    nearby_info: '',
    tags: [],
    tagInput: '',
    location_info: {
      formatted_address: '',
      country: '中国',
      province: '',
      city: '',
      district: '',
      street: '',
      number: '',
      location: ''
    }
  });
  const [hotelImages, setHotelImages] = useState([]); // Array of { url, base64 }

  const formattedAddress = useMemo(() => {
    const { country, province, city, district, street, number } = generalInfo.location_info;
    return [country, province, city, district, street, number].filter(Boolean).join('');
  }, [
    generalInfo.location_info.country,
    generalInfo.location_info.province,
    generalInfo.location_info.city,
    generalInfo.location_info.district,
    generalInfo.location_info.street,
    generalInfo.location_info.number
  ]);

  useEffect(() => {
    if (formattedAddress !== generalInfo.location_info.formatted_address) {
      setGeneralInfo(prev => ({
        ...prev,
        location_info: { ...prev.location_info, formatted_address: formattedAddress }
      }));
    }
  }, [formattedAddress, generalInfo.location_info.formatted_address]);

  // Facilities & Policies State
  const [selectedFacilities, setSelectedFacilities] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [policies, setPolicies] = useState({
    cancellation: '',
    payment: '',
    children: '',
    pets: ''
  });

  // Room Types State
  const [roomTypes, setRoomTypes] = useState([]);
  // roomType structure: 
  // { id: tempId, name, bed_type, area, description, facilities: [], services: [], policies: {}, tags: [], images: [], prices: {} }

  useEffect(() => {
    if (!initialData) {
      return;
    }
    const locationInfo = initialData.location_info || {};
    setGeneralInfo({
      hotel_name_cn: initialData.hotel_name_cn || '',
      hotel_name_en: initialData.hotel_name_en || '',
      star_rating: initialData.star_rating || 3,
      description: initialData.description || '',
      phone: initialData.phone || '',
      opening_date: initialData.opening_date || new Date().toISOString().split('T')[0],
      nearby_info: initialData.nearby_info || '',
      tags: Array.isArray(initialData.tags) ? initialData.tags : [],
      tagInput: '',
      location_info: {
        formatted_address: locationInfo.formatted_address || '',
        country: locationInfo.country || '中国',
        province: locationInfo.province || '',
        city: locationInfo.city || '',
        district: locationInfo.district || '',
        street: locationInfo.street || '',
        number: locationInfo.number || '',
        location: locationInfo.location || ''
      }
    });

    const facilities = (initialData.facilities || []).map((item) => item?.id || item).filter(Boolean);
    const services = (initialData.services || []).map((item) => item?.id || item).filter(Boolean);
    setSelectedFacilities(facilities);
    setSelectedServices(services);

    setPolicies({
      cancellation: initialData.policies?.cancellation || '',
      payment: initialData.policies?.payment || '',
      children: initialData.policies?.children || '',
      pets: initialData.policies?.pets || ''
    });

    const mainImages = Array.isArray(initialData.main_image_url) ? initialData.main_image_url : initialData.main_image_url ? [initialData.main_image_url] : [];
    setHotelImages(mainImages.filter(Boolean).map((url) => ({ base64: url, url })));

    const roomPrices = initialData.room_prices || {};
    const rooms = Object.entries(roomPrices).map(([name, room], index) => ({
      _tempId: Date.now() + index,
      name: name || '',
      bed_type: room?.bed_type || 'king',
      area: room?.area || 30,
      description: room?.description || '',
      facilities: (room?.facilities || []).map((item) => item?.id || item).filter(Boolean),
      services: (room?.services || []).map((item) => item?.id || item).filter(Boolean),
      policies: {
        cancellation: room?.policies?.cancellation || '',
        payment: room?.policies?.payment || '',
        children: room?.policies?.children || '',
        pets: room?.policies?.pets || ''
      },
      tags: room?.tags || [],
      tagInput: '',
      images: room?.room_image_url ? [{ base64: room.room_image_url, url: room.room_image_url }] : [],
      prices: room?.prices || {}
    }));
    setRoomTypes(rooms);
  }, [initialData]);

  const handleGeneralChange = (field, value) => {
    setGeneralInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleLocationChange = (field, value) => {
    setGeneralInfo(prev => ({
      ...prev,
      location_info: { ...prev.location_info, [field]: value }
    }));
  };

  const handleAddTag = () => {
    if (generalInfo.tagInput.trim()) {
      setGeneralInfo(prev => ({
        ...prev,
        tags: [...prev.tags, prev.tagInput.trim()],
        tagInput: ''
      }));
    }
  };

  const handleRemoveTag = (index) => {
    setGeneralInfo(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }));
  };

  const handleImageUpload = (e, isRoom = false, roomIndex = null) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const imageObj = { base64: reader.result, url: '' }; // URL would be empty for new uploads
      if (isRoom && roomIndex !== null) {
        const newRooms = [...roomTypes];
        newRooms[roomIndex].images = [imageObj]; // Single image for room as per UI simplified, but API supports array? No, API room_image_base64 is string
        setRoomTypes(newRooms);
      } else {
        setHotelImages(prev => [...prev, imageObj]);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCheckboxChange = (list, setList, item) => {
    if (list.includes(item.id)) {
      setList(list.filter(id => id !== item.id));
    } else {
      setList([...list, item.id]);
    }
  };

  const addRoomType = () => {
    setRoomTypes([...roomTypes, {
      _tempId: Date.now(),
      name: '',
      bed_type: 'king',
      area: 30,
      description: '',
      facilities: [],
      services: [],
      policies: { cancellation: '', payment: '', children: '', pets: '' },
      tags: [],
      tagInput: '',
      images: [],
      prices: {} // 'YYYY-MM-DD': price
    }]);
  };

  const updateRoomType = (index, field, value) => {
    const newRooms = [...roomTypes];
    newRooms[index][field] = value;
    setRoomTypes(newRooms);
  };

  const updateRoomPolicy = (index, field, value) => {
    const newRooms = [...roomTypes];
    newRooms[index].policies[field] = value;
    setRoomTypes(newRooms);
  };

  const handleRoomTagAdd = (index) => {
    const room = roomTypes[index];
    if (room.tagInput.trim()) {
      const newRooms = [...roomTypes];
      newRooms[index].tags.push(room.tagInput.trim());
      newRooms[index].tagInput = '';
      setRoomTypes(newRooms);
    }
  };

  const handleRoomCheckboxChange = (index, field, itemId) => {
    const newRooms = [...roomTypes];
    const list = newRooms[index][field]; // facilities or services
    if (list.includes(itemId)) {
      newRooms[index][field] = list.filter(id => id !== itemId);
    } else {
      newRooms[index][field] = [...list, itemId];
    }
    setRoomTypes(newRooms);
  };

  // Pricing Logic
  const [batchPrice, setBatchPrice] = useState({
    roomIndex: null,
    startDate: '',
    endDate: '',
    price: ''
  });

  const applyBatchPrice = () => {
    const { roomIndex, startDate, endDate, price } = batchPrice;
    if (roomIndex === null || !startDate || !endDate || !price) return;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const priceVal = parseFloat(price);
    const newRooms = [...roomTypes];
    const room = newRooms[roomIndex];

    for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      room.prices[dateStr] = priceVal;
    }
    setRoomTypes(newRooms);
    setBatchPrice({ ...batchPrice, roomIndex: null }); // Close modal/panel
  };

  const buildPayload = () => {
    const mainImageBase64 = hotelImages
      .map((img) => img.base64)
      .filter((value) => typeof value === 'string' && value.startsWith('data:'));
    const mainImageUrl = hotelImages
      .map((img) => img.url)
      .filter((value) => typeof value === 'string' && value && !value.startsWith('data:'));

    const payload = {
      ...generalInfo,
      star_rating: Number(generalInfo.star_rating),
      facilities: FACILITIES_OPTIONS.filter(f => selectedFacilities.includes(f.id)),
      services: SERVICES_OPTIONS.filter(s => selectedServices.includes(s.id)),
      policies,
      main_image_url: mainImageUrl,
      main_image_base64: mainImageBase64,
      room_prices: {}
    };

    roomTypes.forEach(room => {
      const roomImageBase64 = room.images[0]?.base64 && room.images[0].base64.startsWith('data:') ? room.images[0].base64 : '';
      const roomImageUrl = room.images[0]?.url && !room.images[0].url.startsWith('data:') ? room.images[0].url : '';
      payload.room_prices[room.name] = {
        bed_type: room.bed_type,
        area: Number(room.area),
        description: room.description,
        facilities: ROOM_FACILITIES_OPTIONS.filter(f => room.facilities.includes(f.id)),
        services: ROOM_SERVICES_OPTIONS.filter(s => room.services.includes(s.id)),
        policies: room.policies,
        tags: room.tags,
        room_image_url: roomImageUrl,
        room_image_base64: roomImageBase64,
        prices: room.prices
      };
    });

    return payload;
  };

  const handleSubmit = async () => {
    // Validation
    if (!generalInfo.hotel_name_cn) return alert('请填写酒店中文名称');
    if (roomTypes.length === 0) return alert('请至少添加一种房型');
    const locationFields = ['formatted_address', 'country', 'province', 'city', 'district', 'street', 'number', 'location'];
    const missingLocationField = locationFields.find((field) => !generalInfo.location_info[field]?.trim());
    if (missingLocationField) return alert('请填写完整位置信息');
    const locationPattern = /^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/;
    if (!locationPattern.test(generalInfo.location_info.location.trim())) return alert('经纬度格式应为: 经度,纬度');

    setSubmitting(true);
    const token = localStorage.getItem('token');
    const payload = buildPayload();

    try {
      const response = await fetch(isEditMode ? `${API_BASE}/hotel/update/${hotelId}` : `${API_BASE}/hotel/create`, {
        method: isEditMode ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(isEditMode ? { ...payload, save_as_draft: false } : payload)
      });
      const result = await response.json();
      if (result.code === 0) {
        alert(isEditMode ? '酒店更新成功！' : '酒店创建成功！');
        onBack();
      } else {
        alert(result.msg || (isEditMode ? '更新失败' : '创建失败'));
      }
    } catch (error) {
      alert('网络错误');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const token = localStorage.getItem('token');
    const payload = {
      ...buildPayload(),
      save_as_draft: true
    };

    try {
      const response = await fetch(isEditMode ? `${API_BASE}/hotel/update/${hotelId}` : `${API_BASE}/hotel/create`, {
        method: isEditMode ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (result.code === 0) {
        alert(result.msg || '草稿已保存');
      } else {
        alert(result.msg || '保存失败');
      }
    } catch (error) {
      alert('网络错误');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <button onClick={onBack} className="hover:text-primary">Listings</button>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <span className="text-slate-900 dark:text-white font-bold">{isEditMode ? 'Edit Hotel' : 'Create New Hotel'}</span>
        </div>
        <div className="flex gap-3">
            <button type="button" onClick={onBack} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
            <button type="button" onClick={(event) => { event.stopPropagation(); handleSave(); }} disabled={saving || submitting} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg">{saving ? 'Saving...' : 'Save'}</button>
            <button 
                type="button"
                onClick={handleSubmit} 
                disabled={submitting || saving}
                className="px-6 py-2 bg-primary text-white text-sm font-bold rounded-lg shadow-lg shadow-primary/25 hover:bg-primary/90 flex items-center gap-2"
            >
                {submitting ? 'Submitting...' : 'Submit Hotel'}
                <span className="material-symbols-outlined text-lg">check</span>
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-5xl mx-auto space-y-8">
            
            {/* Module 1: General Info */}
            <section className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-6">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">1. General Information</h2>
                    <p className="text-sm text-slate-500 mt-1">Basic hotel details and location.</p>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Hotel Name (CN)</label>
                            <input className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-primary focus:border-primary" 
                                value={generalInfo.hotel_name_cn} onChange={(e) => handleGeneralChange('hotel_name_cn', e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Hotel Name (EN)</label>
                            <input className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-primary focus:border-primary" 
                                value={generalInfo.hotel_name_en} onChange={(e) => handleGeneralChange('hotel_name_en', e.target.value)} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Star Rating</label>
                                <select className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                                    value={generalInfo.star_rating} onChange={(e) => handleGeneralChange('star_rating', e.target.value)}>
                                    {[1, 2, 3, 4, 5].map(r => <option key={r} value={r}>{r} Star</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Opening Date</label>
                                <input type="date" disabled className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 cursor-not-allowed"
                                    value={generalInfo.opening_date} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Phone</label>
                            <input className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                                value={generalInfo.phone} onChange={(e) => handleGeneralChange('phone', e.target.value)} />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Description</label>
                            <textarea className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg h-32"
                                value={generalInfo.description} onChange={(e) => handleGeneralChange('description', e.target.value)}></textarea>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Nearby Info</label>
                            <input className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                                value={generalInfo.nearby_info} onChange={(e) => handleGeneralChange('nearby_info', e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Tags</label>
                            <div className="flex gap-2 mb-2 flex-wrap">
                                {generalInfo.tags.map((tag, i) => (
                                    <span key={i} className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full flex items-center gap-1">
                                        {tag} <button onClick={() => handleRemoveTag(i)} className="hover:text-red-500">×</button>
                                    </span>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <input className="flex-1 px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                                    value={generalInfo.tagInput} onChange={(e) => handleGeneralChange('tagInput', e.target.value)} placeholder="Add tag..." />
                                <button onClick={handleAddTag} className="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-bold text-slate-600">+</button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Location & Image */}
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h3 className="text-sm font-bold text-slate-900 mb-4">Location Details</h3>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <input className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" placeholder="Country" value={generalInfo.location_info.country} onChange={(e) => handleLocationChange('country', e.target.value)} />
                            <input className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" placeholder="Province" value={generalInfo.location_info.province} onChange={(e) => handleLocationChange('province', e.target.value)} />
                            <input className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" placeholder="City" value={generalInfo.location_info.city} onChange={(e) => handleLocationChange('city', e.target.value)} />
                            <input className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" placeholder="District" value={generalInfo.location_info.district} onChange={(e) => handleLocationChange('district', e.target.value)} />
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <input className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" placeholder="Street" value={generalInfo.location_info.street} onChange={(e) => handleLocationChange('street', e.target.value)} />
                            <input className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" placeholder="Number" value={generalInfo.location_info.number} onChange={(e) => handleLocationChange('number', e.target.value)} />
                        </div>
                        <input className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm mb-4 text-slate-500 cursor-not-allowed" placeholder="Formatted Address"
                            value={generalInfo.location_info.formatted_address} readOnly />
                        <input className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm mb-4" placeholder="Location (lng,lat)"
                            value={generalInfo.location_info.location} onChange={(e) => handleLocationChange('location', e.target.value)} />
                        
                        <div className="h-32 bg-slate-100 rounded-xl flex items-center justify-center border border-dashed border-slate-300 relative group cursor-pointer">
                            <div className="text-center">
                                <span className="material-symbols-outlined text-3xl text-slate-400">map</span>
                                <p className="text-xs text-slate-500 font-medium mt-1">Open Map Picker</p>
                            </div>
                            {/* Placeholder for map picker trigger */}
                        </div>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-900 mb-4">Hotel Images</h3>
                        <div className="grid grid-cols-3 gap-3">
                            {hotelImages.map((img, i) => (
                                <div key={i} className="aspect-video bg-slate-100 rounded-lg bg-cover bg-center relative group" style={{ backgroundImage: `url(${img.base64 || img.url || DEFAULT_IMAGE})` }}>
                                    <button onClick={() => setHotelImages(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="material-symbols-outlined text-[10px]">close</span>
                                    </button>
                                </div>
                            ))}
                            <label className="aspect-video bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors">
                                <span className="material-symbols-outlined text-slate-400">add_photo_alternate</span>
                                <span className="text-xs text-slate-500 font-medium mt-1">Upload</span>
                                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                            </label>
                        </div>
                    </div>
                </div>
            </section>

            {/* Module 2: Facilities & Services & Policies */}
            <section className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-6">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">2. Facilities, Services & Policies</h2>
                </div>
                <div className="p-6 space-y-8">
                    <div>
                        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">Facilities</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {FACILITIES_OPTIONS.map(opt => (
                                <label key={opt.id} className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-slate-50">
                                    <input type="checkbox" className="rounded text-primary focus:ring-primary"
                                        checked={selectedFacilities.includes(opt.id)}
                                        onChange={() => handleCheckboxChange(selectedFacilities, setSelectedFacilities, opt)} />
                                    <span className="text-sm text-slate-700">{opt.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">Services</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {SERVICES_OPTIONS.map(opt => (
                                <label key={opt.id} className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-slate-50">
                                    <input type="checkbox" className="rounded text-primary focus:ring-primary"
                                        checked={selectedServices.includes(opt.id)}
                                        onChange={() => handleCheckboxChange(selectedServices, setSelectedServices, opt)} />
                                    <span className="text-sm text-slate-700">{opt.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">Policies</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input className="px-3 py-2 bg-slate-50 border rounded-lg text-sm" placeholder="Cancellation Policy" 
                                value={policies.cancellation} onChange={e => setPolicies({...policies, cancellation: e.target.value})} />
                            <input className="px-3 py-2 bg-slate-50 border rounded-lg text-sm" placeholder="Payment Policy"
                                value={policies.payment} onChange={e => setPolicies({...policies, payment: e.target.value})} />
                            <input className="px-3 py-2 bg-slate-50 border rounded-lg text-sm" placeholder="Children Policy"
                                value={policies.children} onChange={e => setPolicies({...policies, children: e.target.value})} />
                            <input className="px-3 py-2 bg-slate-50 border rounded-lg text-sm" placeholder="Pets Policy"
                                value={policies.pets} onChange={e => setPolicies({...policies, pets: e.target.value})} />
                        </div>
                    </div>
                </div>
            </section>

            {/* Module 3: Room Types & Pricing */}
            <section className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-6 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">3. Room Types & Pricing</h2>
                    <button onClick={addRoomType} className="px-4 py-2 bg-primary/10 text-primary text-sm font-bold rounded-lg hover:bg-primary/20 flex items-center gap-1">
                        <span className="material-symbols-outlined text-base">add</span> Add Room Type
                    </button>
                </div>
                
                <div>
                    {roomTypes.map((room, index) => (
                        <div key={room._tempId} className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="font-bold text-slate-800">Room Type #{index + 1}</h3>
                                <button onClick={() => setRoomTypes(roomTypes.filter((_, i) => i !== index))} className="text-red-500 hover:text-red-700 text-sm font-bold">Remove</button>
                            </div>
                            
                            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                                {/* Room Details */}
                                <div className="xl:col-span-4 space-y-4">
                                    <input className="w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm" placeholder="Room Name (e.g. Deluxe King)"
                                        value={room.name} onChange={(e) => updateRoomType(index, 'name', e.target.value)} />
                                    <div className="grid grid-cols-2 gap-3">
                                        <select className="w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm"
                                            value={room.bed_type} onChange={(e) => updateRoomType(index, 'bed_type', e.target.value)}>
                                            <option value="king">King Bed</option>
                                            <option value="queen">Queen Bed</option>
                                            <option value="twin">Twin Beds</option>
                                        </select>
                                        <div className="relative">
                                            <input type="number" className="w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm" placeholder="Area"
                                                value={room.area} onChange={(e) => updateRoomType(index, 'area', e.target.value)} />
                                            <span className="absolute right-3 top-2 text-xs text-slate-400">m²</span>
                                        </div>
                                    </div>
                                    <textarea className="w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm h-24" placeholder="Room Description"
                                        value={room.description} onChange={(e) => updateRoomType(index, 'description', e.target.value)}></textarea>
                                    
                                    {/* Room Image */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Room Image</label>
                                        {room.images[0] ? (
                                            <div className="aspect-video bg-cover bg-center rounded-lg relative group" style={{ backgroundImage: `url(${room.images[0].base64 || room.images[0].url || DEFAULT_IMAGE})` }}>
                                                <button onClick={() => {
                                                    const newRooms = [...roomTypes];
                                                    newRooms[index].images = [];
                                                    setRoomTypes(newRooms);
                                                }} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100">×</button>
                                            </div>
                                        ) : (
                                            <label className="block w-full aspect-video border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center cursor-pointer hover:bg-slate-50">
                                                <span className="text-xs text-slate-400">Upload Image</span>
                                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, true, index)} />
                                            </label>
                                        )}
                                    </div>

                                    {/* Room Tags */}
                                    <div>
                                        <div className="flex gap-2 mb-2 flex-wrap">
                                            {room.tags.map((tag, tIdx) => (
                                                <span key={tIdx} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-full">{tag}</span>
                                            ))}
                                        </div>
                                        <div className="flex gap-2">
                                            <input className="flex-1 px-2 py-1 bg-slate-50 border rounded text-xs"
                                                value={room.tagInput} onChange={(e) => updateRoomType(index, 'tagInput', e.target.value)} placeholder="Tag..." />
                                            <button onClick={() => handleRoomTagAdd(index)} className="px-2 bg-slate-200 text-xs rounded">+</button>
                                        </div>
                                    </div>
                                </div>

                                {/* Facilities & Pricing */}
                                <div className="xl:col-span-8 space-y-6">
                                    <div className="bg-slate-50 p-4 rounded-xl">
                                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Room Facilities</h4>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                            {ROOM_FACILITIES_OPTIONS.map(opt => (
                                                <label key={opt.id} className="flex items-center gap-2 cursor-pointer">
                                                    <input type="checkbox" className="rounded text-primary"
                                                        checked={room.facilities.includes(opt.id)}
                                                        onChange={() => handleRoomCheckboxChange(index, 'facilities', opt.id)} />
                                                    <span className="text-xs text-slate-700">{opt.name}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Pricing Calendar UI */}
                                    <div>
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="font-bold text-sm text-slate-700">Daily Pricing</h4>
                                            <button 
                                                onClick={() => setBatchPrice({ ...batchPrice, roomIndex: index })}
                                                className="px-3 py-1 bg-primary text-white text-xs font-bold rounded shadow-sm hover:bg-primary/90"
                                            >
                                                Batch Set Price
                                            </button>
                                        </div>
                                        <div className="overflow-x-auto border border-slate-200 rounded-lg">
                                            <div className="flex divide-x divide-slate-200">
                                                {Array.from({ length: 7 }).map((_, dIdx) => {
                                                    const priceDates = Object.keys(room.prices || {}).sort();
                                                    const baseDate = priceDates.length ? new Date(priceDates[0]) : new Date();
                                                    const safeBaseDate = Number.isNaN(baseDate.getTime()) ? new Date() : baseDate;
                                                    const date = new Date(safeBaseDate);
                                                    date.setDate(safeBaseDate.getDate() + dIdx);
                                                    const dateStr = date.toISOString().split('T')[0];
                                                    const price = room.prices[dateStr] || '';
                                                    return (
                                                        <div key={dIdx} className="flex-1 min-w-[80px] text-center p-2">
                                                            <div className="text-xs text-slate-500 mb-1">{date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })}</div>
                                                            <input 
                                                                type="number" 
                                                                className="w-full px-1 py-1 text-center text-sm font-bold text-slate-900 border border-slate-200 rounded focus:border-primary focus:ring-1 focus:ring-primary"
                                                                placeholder="-"
                                                                value={price}
                                                                onChange={(e) => {
                                                                    const newRooms = [...roomTypes];
                                                                    newRooms[index].prices[dateStr] = parseFloat(e.target.value);
                                                                    setRoomTypes(newRooms);
                                                                }}
                                                            />
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {roomTypes.length === 0 && (
                        <div className="p-12 text-center text-slate-400">
                            <p>No room types added yet. Click "Add Room Type" to start.</p>
                        </div>
                    )}
                </div>
            </section>
        </div>
      </div>

      {/* Batch Price Modal */}
      {batchPrice.roomIndex !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
              <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
                  <h3 className="font-bold text-lg mb-4">Batch Set Price</h3>
                  <div className="space-y-3">
                      <div>
                          <label className="text-xs font-bold text-slate-500 uppercase">Start Date</label>
                          <input type="date" className="w-full px-3 py-2 border rounded-lg" 
                              value={batchPrice.startDate} onChange={e => setBatchPrice({...batchPrice, startDate: e.target.value})} />
                      </div>
                      <div>
                          <label className="text-xs font-bold text-slate-500 uppercase">End Date</label>
                          <input type="date" className="w-full px-3 py-2 border rounded-lg" 
                              value={batchPrice.endDate} onChange={e => setBatchPrice({...batchPrice, endDate: e.target.value})} />
                      </div>
                      <div>
                          <label className="text-xs font-bold text-slate-500 uppercase">Price</label>
                          <input type="number" className="w-full px-3 py-2 border rounded-lg" placeholder="Price"
                              value={batchPrice.price} onChange={e => setBatchPrice({...batchPrice, price: e.target.value})} />
                      </div>
                  </div>
                  <div className="flex gap-3 mt-6">
                      <button onClick={() => setBatchPrice({...batchPrice, roomIndex: null})} className="flex-1 py-2 bg-slate-100 font-bold text-slate-600 rounded-lg">Cancel</button>
                      <button onClick={applyBatchPrice} className="flex-1 py-2 bg-primary text-white font-bold rounded-lg">Apply</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}
