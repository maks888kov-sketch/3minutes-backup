import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useUpdateProfile } from '@/lib/useProfile';
import { buildFilterPatch, DEFAULT_MAX_AGE, DEFAULT_MIN_AGE } from '@/lib/discoverFilters';

export function useSearchFilters(profile) {
  const updateProfile = useUpdateProfile();
  const queryClient = useQueryClient();

  const [ageRange, setAgeRange] = useState([DEFAULT_MIN_AGE, DEFAULT_MAX_AGE]);
  const [cityFilter, setCityFilter] = useState('');
  const [lookingFor, setLookingFor] = useState('everyone');

  useEffect(() => {
    if (!profile) return;
    setAgeRange([profile.min_age_filter || DEFAULT_MIN_AGE, profile.max_age_filter || DEFAULT_MAX_AGE]);
    setCityFilter(profile.city_filter || '');
    setLookingFor(profile.looking_for || 'everyone');
  }, [profile]);

  const persistFilters = useCallback((patch) => {
    if (!profile?.id) return;
    updateProfile.mutate(
      { id: profile.id, data: patch },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['discover'] });
        },
      }
    );
  }, [profile?.id, updateProfile, queryClient]);

  const handleAgeChange = useCallback((range) => {
    setAgeRange(range);
    persistFilters(buildFilterPatch({ ageRange: range, cityFilter, lookingFor }));
  }, [cityFilter, lookingFor, persistFilters]);

  const handleCityChange = useCallback((val) => {
    setCityFilter(val === 'Все города' ? '' : val);
    persistFilters(buildFilterPatch({
      ageRange,
      cityFilter: val,
      lookingFor,
    }));
  }, [ageRange, lookingFor, persistFilters]);

  const handleLookingForChange = useCallback((val) => {
    setLookingFor(val);
    persistFilters(buildFilterPatch({ ageRange, cityFilter, lookingFor: val }));
  }, [ageRange, cityFilter, persistFilters]);

  return {
    ageRange,
    cityFilter,
    lookingFor,
    handleAgeChange,
    handleCityChange,
    handleLookingForChange,
    isSaving: updateProfile.isPending,
  };
}
