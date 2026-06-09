/* b44-full-sync 2026-06-01 */
import { displayInterest, getGoalDisplay } from '@/lib/profileUtils';

const FALLBACK_PHOTO = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&h=900&fit=crop';

/**
 * Слайды анкеты: на каждом фото — свой набор тегов и текста (как MosDate).
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

function truncateBio(bio, max = 42) {
  if (!bio) return '';
  return bio.length > max ? `${bio.slice(0, max)}…` : bio;
}

function buildAutoSlides(profile, photos) {
  const goal = getGoalDisplay(profile.goal);
  const interests = (profile.interests || []).map((tag) => normalizeTag(tag)).filter((t) => t?.label);
  const count = photos.length;

  return photos.map((url, index) => {
    const isLast = index === count - 1;

    /* Фото 1 — как MosDate: имя, 2 тега, +N, одна строка bio */
    if (index === 0) {
      const firstTags = [
        { emoji: goal.emoji, label: goal.label },
        profile.city ? { emoji: '📍', label: profile.city } : null,
      ].filter(Boolean);

      return {
        url,
        showName: true,
        tags: firstTags.slice(0, 2),
        moreTagsCount: Math.max(0, firstTags.length - 2 + interests.length),
        text: truncateBio(profile.bio),
      };
    }

    const interestStart = (index - 1) * 2;
    const chunk = interests.slice(interestStart, interestStart + 2);
    const extraTags = [];

    if (isLast && profile.height_cm) {
      extraTags.push({ emoji: '📏', label: `${profile.height_cm} см` });
    }

    const slideTags = [...chunk, ...extraTags];
    const rest = interests.length - interestStart - chunk.length;

    return {
      url,
      showName: false,
      tags: slideTags.slice(0, 2),
      moreTagsCount: Math.max(0, slideTags.length - 2 + (rest > 0 ? rest : 0)),
      text: isLast ? truncateBio(profile.bio, 56) : '',
    };
  });
}

export function buildPhotoSlides(profile) {
  const photos = getProfilePhotos(profile);

  if (Array.isArray(profile?.photo_slides) && profile.photo_slides.length > 0) {
    return photos.map((url, index) => {
      const custom = profile.photo_slides[index] || profile.photo_slides[profile.photo_slides.length - 1];
      const tags = (custom.tags || []).map(normalizeTag).filter((t) => t?.label);
      return {
        url,
        showName: custom.showName ?? index === 0,
        tags: tags.slice(0, 2),
        moreTagsCount: Math.max(0, tags.length - 2),
        text: truncateBio(custom.text || custom.hint || ''),
      };
    });
  }

  return buildAutoSlides(profile, photos);
}

export function getPhotoCount(profile) {
  return getProfilePhotos(profile).length;
}
