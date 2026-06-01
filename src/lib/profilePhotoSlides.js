/* b44-full-sync 2026-06-01 */
import { displayInterest, getGoalDisplay } from '@/lib/profileUtils';

const FALLBACK_PHOTO = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&h=900&fit=crop';

/**
 * Слайды анкеты: на каждом фото — свой набор тегов и текста.
 * Если в профиле есть photo_slides — используем их, иначе собираем автоматически.
 */
export function getProfilePhotos(profile) {
  if (profile?.photos?.length > 0) return profile.photos;
  return [FALLBACK_PHOTO];
}

function normalizeTag(tag) {
  if (!tag) return null;
  if (typeof tag === 'string') {
    const { emoji, label } = displayInterest(tag);
    return { emoji, label };
  }
  return {
    emoji: tag.emoji || '✨',
    label: tag.label || tag.text || '',
  };
}

function buildAutoSlides(profile, photos) {
  const goal = getGoalDisplay(profile.goal);
  const interests = (profile.interests || []).map((tag) => normalizeTag(tag)).filter((t) => t?.label);
  const count = photos.length;

  return photos.map((url, index) => {
    if (count === 1) {
      return {
        url,
        showName: true,
        tags: [
          { emoji: goal.emoji, label: goal.label },
          profile.city ? { emoji: '📍', label: profile.city } : null,
          ...interests.slice(0, 2),
        ].filter(Boolean),
        text: profile.bio || '',
      };
    }

    if (index === 0) {
      return       {
        showName: true,
        tags: [
          { emoji: goal.emoji, label: goal.label },
          profile.city ? { emoji: '📍', label: profile.city } : null,
        ].filter(Boolean),
        text: profile.bio ? `${profile.bio.slice(0, 72)}${profile.bio.length > 72 ? '…' : ''}` : '',
        extraTagCount: Math.max(0, interests.length + (profile.height_cm ? 1 : 0)),
      };
    }

    const interestStart = (index - 1) * 3;
    const chunk = interests.slice(interestStart, interestStart + 4);
    const isLast = index === count - 1;
    const extraTags = [];

    if (isLast && profile.height_cm) {
      extraTags.push({ emoji: '📏', label: `${profile.height_cm} см` });
    }

    return {
      url,
      showName: isLast,
      tags: [...(chunk.length > 0 ? chunk : [
        profile.city ? { emoji: '📍', label: profile.city } : null,
        { emoji: goal.emoji, label: goal.label },
      ].filter(Boolean)), ...extraTags],
      text: isLast ? (profile.bio || '') : (interests[interestStart]?.label ? `${interests[interestStart].emoji} ${interests[interestStart].label}` : ''),
    };
  });
}

export function buildPhotoSlides(profile) {
  const photos = getProfilePhotos(profile);

  if (Array.isArray(profile?.photo_slides) && profile.photo_slides.length > 0) {
    return photos.map((url, index) => {
      const custom = profile.photo_slides[index] || profile.photo_slides[profile.photo_slides.length - 1];
      return {
        url,
        showName: custom.showName ?? index === 0,
        tags: (custom.tags || []).map(normalizeTag).filter((t) => t?.label),
        text: custom.text || custom.hint || '',
      };
    });
  }

  return buildAutoSlides(profile, photos);
}

export function getPhotoCount(profile) {
  return getProfilePhotos(profile).length;
}
