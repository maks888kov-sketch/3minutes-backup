import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useCurrentProfile, useUpdateProfile } from '@/lib/useProfile';
import {
  Camera, MapPin, Settings2, Crown,
  LogOut, ChevronRight, Pencil, Shield, Bell, Eye, Loader2, Lightbulb, Star
} from 'lucide-react';
import EditProfileSheet from '@/components/profile/EditProfileSheet';
import AgeRangeSlider from '@/components/profile/AgeRangeSlider';

const CITIES = ['Москва', 'Санкт-Петербург', 'Казань', 'Екатеринбург', 'Новосибирск', 'Все города'];

const STATUSES = [
  { id: 'chat', emoji: '💬', label: 'Хочу общения' },
  { id: 'love', emoji: '❤️', label: 'Ищу отношения' },
  { id: 'date', emoji: '🍷', label: 'Готов к свиданию' },
  { id: 'fun', emoji: '🎮', label: 'Просто пообщаться' },
];

export default function Settings() {
  const navigate = useNavigate();
  const { data: profile, isLoading } = useCurrentProfile();
  const updateProfile = useUpdateProfile();

  const [showEdit, setShowEdit] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [ageRange, setAgeRange] = useState([18, 45]);
  const [cityFilter, setCityFilter] = useState('');
  const [userStatus, setUserStatus] = useState('chat');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (profile) {
      setAgeRange([profile.min_age_filter || 18, profile.max_age_filter || 45]);
      setCityFilter(profile.city_filter || '');
    }
  }, [profile]);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    // Show instant preview
    const reader = new FileReader();
    reader.onload = ev => setPhotoPreview(ev.target.result);
    reader.readAsDataURL(file);
    setPhotoUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await updateProfile.mutateAsync({
      id: profile.id,
      data: { photos: [file_url, ...(profile.photos || []).slice(1)] },
    });
    setPhotoUploading(false);
  };

  const handleSaveProfile = async (data) => {
    if (!profile) return;
    await updateProfile.mutateAsync({ id: profile.id, data });
    setShowEdit(false);
  };

  const handleAgeChange = (range) => {
    setAgeRange(range);
    if (profile) {
      updateProfile.mutate({ id: profile.id, data: { min_age_filter: range[0], max_age_filter: range[1] } });
    }
  };

  const handleCityFilter = (val) => {
    setCityFilter(val);
    if (profile) {
      updateProfile.mutate({ id: profile.id, data: { city_filter: val === 'Все города' ? '' : val } });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const photo = photoPreview || profile?.photos?.[0] || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop';

  return (
    <div className="min-h-screen pb-28 safe-top relative">
      {/* bg glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full opacity-5"
          style={{ background: 'radial-gradient(circle, hsl(270,80%,60%), transparent 70%)' }} />
      </div>

      {/* Header */}
      <div className="relative z-10 px-5 pt-12 pb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Профиль</h1>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowEdit(true)}
          className="p-2.5 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <Pencil className="w-4 h-4" />
        </motion.button>
      </div>

      <div className="relative z-10 px-5 space-y-4">

        {/* Profile card */}
        <div className="rounded-3xl p-6 text-center"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)' }}>

          {/* Avatar */}
          <div className="relative inline-block mb-4">
            <motion.div
              animate={photoUploading ? { scale: [1, 1.05, 1] } : {}}
              transition={{ repeat: Infinity, duration: 1 }}
              className="relative w-28 h-28 rounded-full mx-auto"
              style={{ boxShadow: '0 0 0 3px hsl(270,80%,60%), 0 0 20px rgba(168,85,247,0.4)' }}
            >
              <img src={photo} alt="" className="w-full h-full rounded-full object-cover" />
              {photoUploading && (
                <div className="absolute inset-0 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(0,0,0,0.5)' }}>
                  <Loader2 className="w-6 h-6 animate-spin text-white" />
                </div>
              )}
            </motion.div>

            {/* Camera button */}
            <motion.label
              whileTap={{ scale: 0.9 }}
              className="absolute bottom-0 right-0 w-9 h-9 rounded-full flex items-center justify-center cursor-pointer"
              style={{ background: 'linear-gradient(135deg, hsl(270,80%,60%), hsl(330,85%,60%))', boxShadow: '0 0 12px rgba(168,85,247,0.5)' }}
            >
              <Camera className="w-4 h-4 text-white" />
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
            </motion.label>
          </div>

          <p className="text-xs text-muted-foreground mb-3">Нажми на камеру, чтобы сменить фото</p>

          <h2 className="text-xl font-bold">{profile?.name}{profile?.age ? `, ${profile.age}` : ''}</h2>
          <div className="flex items-center justify-center gap-1 text-muted-foreground mt-1">
            <MapPin className="w-3.5 h-3.5" />
            <span className="text-sm">{profile?.city || 'Не указан'}</span>
          </div>
          {profile?.bio && (
            <p className="text-sm text-muted-foreground mt-3 max-w-xs mx-auto line-clamp-3">{profile.bio}</p>
          )}

          {/* Edit profile button */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowEdit(true)}
            className="mt-4 px-5 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, hsl(270,80%,60%), hsl(330,85%,60%))' }}
          >
            Редактировать профиль
          </motion.button>
        </div>

        {/* My Status */}
        <div className="rounded-2xl p-5"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
            <Star className="w-4 h-4 text-primary" />
            Мой статус
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {STATUSES.map(s => (
              <motion.button
                key={s.id}
                whileTap={{ scale: 0.96 }}
                onClick={() => setUserStatus(s.id)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-left transition-all"
                style={{
                  background: userStatus === s.id ? 'rgba(168,85,247,0.18)' : 'rgba(255,255,255,0.04)',
                  border: userStatus === s.id ? '1.5px solid rgba(168,85,247,0.6)' : '1.5px solid rgba(255,255,255,0.06)',
                  boxShadow: userStatus === s.id ? '0 0 12px rgba(168,85,247,0.25)' : 'none',
                }}
              >
                <span className="text-lg">{s.emoji}</span>
                <span className="text-xs font-medium leading-tight">{s.label}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="rounded-2xl p-5"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <h3 className="font-semibold mb-2 flex items-center gap-2 text-sm">
            <Settings2 className="w-4 h-4 text-primary" />
            Фильтры поиска
          </h3>

          {/* Age range slider */}
          <AgeRangeSlider
            min={18}
            max={65}
            value={ageRange}
            onChange={handleAgeChange}
          />

          {/* City filter */}
          <div className="mt-3">
            <span className="text-xs text-muted-foreground block mb-2">Город</span>
            <select
              value={cityFilter || 'Все города'}
              onChange={e => handleCityFilter(e.target.value)}
              className="w-full h-11 bg-secondary border-0 rounded-xl px-3 text-sm text-foreground outline-none appearance-none"
            >
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Menu */}
        <div className="rounded-2xl overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
          {[
            { icon: Crown, label: 'Premium', color: 'text-yellow-400', onClick: () => navigate('/premium') },
            { icon: Shield, label: 'Верификация', color: 'text-blue-400' },
            { icon: Bell, label: 'Уведомления', color: 'text-primary' },
            { icon: Eye, label: 'Приватность', color: 'text-muted-foreground' },
            { icon: Lightbulb, label: 'Предложить идею', color: 'text-yellow-400', onClick: () => navigate('/feedback') },
          ].map((item, i) => (
            <button
              key={i}
              onClick={item.onClick}
              className="w-full flex items-center gap-3 px-5 py-4 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
            >
              <item.icon className={`w-5 h-5 ${item.color}`} />
              <span className="flex-1 text-left font-medium text-sm">{item.label}</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          ))}
        </div>

        {/* Logout */}
        <button
          onClick={() => base44.auth.logout()}
          className="w-full flex items-center justify-center gap-2 py-3 text-destructive"
        >
          <LogOut className="w-4 h-4" />
          <span className="font-medium text-sm">Выйти</span>
        </button>
      </div>

      {/* Edit Profile Sheet */}
      <AnimatePresence>
        {showEdit && (
          <EditProfileSheet
            profile={profile}
            onSave={handleSaveProfile}
            onClose={() => setShowEdit(false)}
            isSaving={updateProfile.isPending}
          />
        )}
      </AnimatePresence>
    </div>
  );
}