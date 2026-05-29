import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const CITIES = ['Москва', 'Санкт-Петербург', 'Казань', 'Екатеринбург', 'Новосибирск'];

export default function EditProfileSheet({ profile, onSave, onClose, isSaving }) {
  const [form, setForm] = useState({
    name: profile?.name || '',
    age: profile?.age || '',
    city: profile?.city || '',
    bio: profile?.bio || '',
  });

  useEffect(() => {
    if (profile) setForm({ name: profile.name || '', age: profile.age || '', city: profile.city || '', bio: profile.bio || '' });
  }, [profile]);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[200] flex items-center justify-center px-4"
        style={{ paddingBottom: '90px' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* overlay */}
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

        <motion.div
          className="relative w-full max-w-md rounded-3xl z-10 flex flex-col"
          style={{
            background: 'hsl(250,15%,10%)',
            border: '1px solid rgba(255,255,255,0.1)',
            maxHeight: '70vh',
            boxShadow: '0 0 60px rgba(0,0,0,0.6)',
          }}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          {/* header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-4 flex-shrink-0">
            <h3 className="text-lg font-bold">Редактировать профиль</h3>
            <button onClick={onClose} className="p-1.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* scrollable fields */}
          <div className="overflow-y-auto flex-1 px-6 pb-2">
            <div className="space-y-3">
              <Input
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="Имя"
                className="h-11 bg-secondary border-0 rounded-xl"
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="number"
                  value={form.age}
                  onChange={e => setForm(p => ({ ...p, age: e.target.value }))}
                  placeholder="Возраст"
                  className="h-11 bg-secondary border-0 rounded-xl"
                />
                <select
                  value={form.city}
                  onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
                  className="h-11 bg-secondary border-0 rounded-xl px-3 text-sm text-foreground outline-none"
                >
                  <option value="">Выберите город</option>
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <textarea
                value={form.bio}
                onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
                placeholder="О себе..."
                rows={3}
                className="w-full bg-secondary border-0 rounded-xl px-3 py-3 text-sm text-foreground outline-none resize-none placeholder:text-muted-foreground"
              />
            </div>
          </div>

          {/* sticky buttons */}
          <div className="flex gap-3 px-6 py-4 flex-shrink-0 border-t border-white/5">
            <Button variant="ghost" onClick={onClose} className="flex-1 rounded-xl border border-white/10">
              Отмена
            </Button>
            <Button
              onClick={() => onSave({ ...form, age: parseInt(form.age) || profile?.age })}
              disabled={isSaving}
              className="flex-1 rounded-xl border-0"
              style={{ background: 'linear-gradient(135deg, hsl(270,80%,60%), hsl(330,85%,60%))' }}
            >
              {isSaving ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}