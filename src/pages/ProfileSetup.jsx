import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { base44 } from '@/api/base44Client';
import { useCurrentProfile, useUpdateProfile } from '@/lib/useProfile';
import { Camera, ArrowRight, ArrowLeft, Sparkles, MapPin, User, Target } from 'lucide-react';

const interests = [
  '🎵 Музыка', '🎬 Кино', '📚 Книги', '🏋️ Спорт', '✈️ Путешествия',
  '🍳 Кулинария', '🎮 Игры', '📸 Фото', '🎨 Искусство', '💻 Технологии',
  '🐾 Животные', '🧘 Йога', '☕ Кофе', '🎭 Театр', '🌿 Природа',
  '🎸 Гитара', '💃 Танцы', '🏃 Бег', '🎤 Караоке', '🛹 Скейт',
];

const goals = [
  { value: 'relationship', label: '❤️ Отношения', desc: 'Ищу серьёзные отношения' },
  { value: 'friendship', label: '🤝 Дружба', desc: 'Хочу найти друзей' },
  { value: 'networking', label: '💼 Нетворкинг', desc: 'Полезные знакомства' },
  { value: 'chat', label: '💬 Общение', desc: 'Просто пообщаться' },
];

const steps = ['photos', 'basics', 'about', 'interests', 'goal'];

export default function ProfileSetup() {
  const navigate = useNavigate();
  const { data: existingProfile } = useCurrentProfile();
  const updateProfile = useUpdateProfile();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: '',
    age: '',
    city: '',
    bio: '',
    gender: 'male',
    looking_for: 'everyone',
    interests: [],
    goal: 'relationship',
    photos: [],
  });

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(prev => ({ ...prev, photos: [...prev.photos, file_url] }));
  };

  const toggleInterest = (interest) => {
    setForm(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  const handleSubmit = async () => {
    const profileData = {
      ...form,
      age: parseInt(form.age) || 25,
      profile_complete: true,
      is_online: true,
      last_seen: new Date().toISOString(),
    };

    await updateProfile.mutateAsync({
      id: existingProfile?.id,
      data: profileData,
    });
    navigate('/discover');
  };

  const canNext = () => {
    if (step === 0) return form.photos.length > 0;
    if (step === 1) return form.name && form.age && form.city;
    return true;
  };

  return (
    <div className="min-h-screen flex flex-col px-6 py-8 safe-top safe-bottom relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-primary/10 blur-[120px]" />
      </div>

      {/* Progress */}
      <div className="relative z-10 flex items-center gap-1.5 mb-8">
        {steps.map((_, i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-500 ${
            i <= step ? 'gradient-primary' : 'bg-muted'
          }`} />
        ))}
      </div>

      <div className="relative z-10 flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            className="h-full"
          >
            {step === 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-2">Добавь фото</h2>
                <p className="text-muted-foreground mb-6">Покажи себя — добавь хотя бы одно фото</p>
                <div className="grid grid-cols-3 gap-3">
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <label key={i} className="aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer border-2 border-dashed border-muted hover:border-primary/50 transition-colors relative">
                      {form.photos[i] ? (
                        <img src={form.photos[i]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center glass">
                          <Camera className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                      <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                    </label>
                  ))}
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-5">
                <h2 className="text-2xl font-bold mb-2">Расскажи о себе</h2>
                <div>
                  <label className="text-sm text-muted-foreground mb-1.5 block">
                    <User className="w-4 h-4 inline mr-1" />Имя
                  </label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Как тебя зовут?"
                    className="h-12 bg-secondary border-0 rounded-xl text-base"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-muted-foreground mb-1.5 block">Возраст</label>
                    <Input
                      type="number"
                      value={form.age}
                      onChange={(e) => setForm(prev => ({ ...prev, age: e.target.value }))}
                      placeholder="25"
                      className="h-12 bg-secondary border-0 rounded-xl text-base"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-1.5 block">
                      <MapPin className="w-4 h-4 inline mr-1" />Город
                    </label>
                    <Input
                      value={form.city}
                      onChange={(e) => setForm(prev => ({ ...prev, city: e.target.value }))}
                      placeholder="Москва"
                      className="h-12 bg-secondary border-0 rounded-xl text-base"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Пол</label>
                  <div className="flex gap-2">
                    {[
                      { value: 'male', label: '👨 Мужской' },
                      { value: 'female', label: '👩 Женский' },
                    ].map(g => (
                      <button
                        key={g.value}
                        onClick={() => setForm(prev => ({ ...prev, gender: g.value }))}
                        className={`flex-1 h-12 rounded-xl font-medium transition-all ${
                          form.gender === g.value
                            ? 'gradient-primary text-white neon-glow'
                            : 'glass text-muted-foreground'
                        }`}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Кого ищешь?</label>
                  <div className="flex gap-2">
                    {[
                      { value: 'male', label: '👨' },
                      { value: 'female', label: '👩' },
                      { value: 'everyone', label: 'Все' },
                    ].map(g => (
                      <button
                        key={g.value}
                        onClick={() => setForm(prev => ({ ...prev, looking_for: g.value }))}
                        className={`flex-1 h-12 rounded-xl font-medium transition-all ${
                          form.looking_for === g.value
                            ? 'gradient-primary text-white neon-glow'
                            : 'glass text-muted-foreground'
                        }`}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <h2 className="text-2xl font-bold mb-2">О себе</h2>
                <p className="text-muted-foreground mb-6">Напиши пару слов — это поможет найти интересных людей</p>
                <Textarea
                  value={form.bio}
                  onChange={(e) => setForm(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Люблю путешествовать, играю на гитаре, ищу интересных людей для общения..."
                  className="min-h-[200px] bg-secondary border-0 rounded-xl text-base resize-none"
                />
              </div>
            )}

            {step === 3 && (
              <div>
                <h2 className="text-2xl font-bold mb-2">Интересы</h2>
                <p className="text-muted-foreground mb-6">Выбери то, что тебе близко</p>
                <div className="flex flex-wrap gap-2">
                  {interests.map((interest) => (
                    <button
                      key={interest}
                      onClick={() => toggleInterest(interest)}
                      className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        form.interests.includes(interest)
                          ? 'gradient-primary text-white neon-glow'
                          : 'glass text-foreground/70 hover:text-foreground'
                      }`}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 4 && (
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  <Target className="w-6 h-6 inline mr-2" />Цель знакомства
                </h2>
                <p className="text-muted-foreground mb-6">Что ты ищешь?</p>
                <div className="space-y-3">
                  {goals.map((goal) => (
                    <button
                      key={goal.value}
                      onClick={() => setForm(prev => ({ ...prev, goal: goal.value }))}
                      className={`w-full p-4 rounded-2xl text-left transition-all ${
                        form.goal === goal.value
                          ? 'glass-strong border-primary/30 neon-glow'
                          : 'glass'
                      }`}
                    >
                      <div className="text-lg font-semibold">{goal.label}</div>
                      <div className="text-sm text-muted-foreground mt-0.5">{goal.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="relative z-10 flex gap-3 mt-6">
        {step > 0 && (
          <Button
            variant="outline"
            onClick={() => setStep(s => s - 1)}
            className="h-14 px-6 rounded-2xl bg-secondary border-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        )}
        <Button
          onClick={step === steps.length - 1 ? handleSubmit : () => setStep(s => s + 1)}
          disabled={!canNext() || updateProfile.isPending}
          className="flex-1 h-14 text-lg font-semibold gradient-primary rounded-2xl border-0 neon-glow disabled:opacity-40"
        >
          {step === steps.length - 1 ? (
            <>Готово <Sparkles className="w-5 h-5 ml-2" /></>
          ) : (
            <>Далее <ArrowRight className="w-5 h-5 ml-2" /></>
          )}
        </Button>
      </div>
    </div>
  );
}