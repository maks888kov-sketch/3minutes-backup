import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export function useCurrentProfile() {
  return useQuery({
    queryKey: ['currentProfile'],
    queryFn: async () => {
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
      if (id) {
        return base44.entities.Profile.update(id, data);
      }
      return base44.entities.Profile.create(data);
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
    refetchInterval: 3000,
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