import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { syncSdkAuthToken } from '@/lib/uploadFile';
import { getOtherProfileId, isProfileOnline, sharedInterestsCount } from '@/lib/profileUtils';

export function useCurrentProfile() {
  return useQuery({
    queryKey: ['currentProfile'],
    queryFn: async () => {
      syncSdkAuthToken();
      const user = await base44.auth.me();
      const profiles = await base44.entities.Profile.filter({ created_by: user.email });
      return profiles[0] || null;
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }) => {
      syncSdkAuthToken();
      const payload = {
        ...data,
        is_online: data.is_online ?? true,
        last_seen: data.last_seen ?? new Date().toISOString(),
      };

      if (id) {
        return base44.entities.Profile.update(id, payload);
      }

      if (!payload.name?.trim()) {
        throw new Error('Укажите имя');
      }

      return base44.entities.Profile.create({
        gender: 'male',
        looking_for: 'everyone',
        goal: 'relationship',
        interests: [],
        photos: [],
        profile_complete: false,
        ...payload,
        name: payload.name.trim(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentProfile'] });
    },
  });
}

export function useDiscoverProfiles(currentProfile) {
  return useQuery({
    queryKey: ['discover', currentProfile?.id],
    queryFn: async () => {
      if (!currentProfile) return [];
      const allProfiles = await base44.entities.Profile.filter({ profile_complete: true });
      const myLikes = await base44.entities.Like.filter({ from_profile_id: currentProfile.id });
      const likedIds = new Set(myLikes.map(l => l.to_profile_id));
      
      return allProfiles.filter(p => {
        if (p.id === currentProfile.id) return false;
        if (likedIds.has(p.id)) return false;
        if (currentProfile.looking_for !== 'everyone' && p.gender !== currentProfile.looking_for) return false;
        if (currentProfile.min_age_filter && p.age < currentProfile.min_age_filter) return false;
        if (currentProfile.max_age_filter && p.age > currentProfile.max_age_filter) return false;
        if (currentProfile.city_filter && currentProfile.city_filter !== '' && p.city !== currentProfile.city_filter) return false;
        return true;
      }).sort((a, b) => {
        const scoreB = sharedInterestsCount(currentProfile.interests, b.interests);
        const scoreA = sharedInterestsCount(currentProfile.interests, a.interests);
        if (scoreB !== scoreA) return scoreB - scoreA;
        return (isProfileOnline(b) ? 1 : 0) - (isProfileOnline(a) ? 1 : 0);
      });
    },
    enabled: !!currentProfile?.id,
  });
}

export function useMatches(profileId) {
  return useQuery({
    queryKey: ['matches', profileId],
    queryFn: async () => {
      if (!profileId) return [];
      const matchesA = await base44.entities.Match.filter({ profile_a_id: profileId });
      const matchesB = await base44.entities.Match.filter({ profile_b_id: profileId });
      return [...matchesA, ...matchesB].sort((a, b) => 
        new Date(b.last_message_time || b.created_date) - new Date(a.last_message_time || a.created_date)
      );
    },
    enabled: !!profileId,
  });
}

export function useMessages(matchId) {
  return useQuery({
    queryKey: ['messages', matchId],
    queryFn: async () => {
      if (!matchId) return [];
      return base44.entities.Message.filter({ match_id: matchId }, 'created_date', 100);
    },
    enabled: !!matchId,
    refetchInterval: 1500,
  });
}

export function useOnlineCount() {
  return useQuery({
    queryKey: ['onlineCount'],
    queryFn: async () => {
      const profiles = await base44.entities.Profile.filter({ profile_complete: true });
      return profiles.filter((p) => isProfileOnline(p)).length;
    },
    refetchInterval: 60_000,
  });
}

export function useChatList(profileId) {
  const { data: matches = [], isLoading: matchesLoading } = useMatches(profileId);

  return useQuery({
    queryKey: ['chatList', profileId, matches.map((m) => m.id).join(',')],
    queryFn: async () => {
      if (!profileId || !matches.length) return [];

      const otherIds = [...new Set(matches.map((m) => getOtherProfileId(m, profileId)).filter(Boolean))];
      const profilePairs = await Promise.all(
        otherIds.map((id) => base44.entities.Profile.filter({ id }).then((ps) => [id, ps[0]]))
      );
      const profileMap = Object.fromEntries(profilePairs.filter(([, p]) => p));

      return matches.map((match) => {
        const otherId = getOtherProfileId(match, profileId);
        const other = profileMap[otherId];
        const unread =
          match.profile_a_id === profileId ? match.unread_count_a || 0 : match.unread_count_b || 0;

        return {
          match,
          other,
          unread,
          lastMessage: match.last_message_text || 'Начните общение',
          lastTime: match.last_message_time || match.created_date,
        };
      });
    },
    enabled: !!profileId && matches.length > 0,
    refetchInterval: 5000,
  });
}

export function useLikedMe(profileId) {
  return useQuery({
    queryKey: ['likedMe', profileId],
    queryFn: async () => {
      if (!profileId) return [];
      return base44.entities.Like.filter({ to_profile_id: profileId, is_like: true });
    },
    enabled: !!profileId,
  });
}

export function useLikedMeProfiles(profileId) {
  const { data: likes = [] } = useLikedMe(profileId);

  return useQuery({
    queryKey: ['likedMeProfiles', profileId, likes.map((l) => l.from_profile_id).join(',')],
    queryFn: async () => {
      if (!likes.length) return [];
      const ids = [...new Set(likes.map((l) => l.from_profile_id))];
      const profiles = await Promise.all(
        ids.map((id) => base44.entities.Profile.filter({ id }).then((ps) => ps[0]))
      );
      return profiles.filter(Boolean);
    },
    enabled: !!profileId && likes.length > 0,
  });
}