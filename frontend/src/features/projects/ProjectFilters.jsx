import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import { useDebounce } from '@/hooks/useDebounce';
import { setFilter, resetFilters, selectProjectFilters } from './projectSlice';
import { DOMAINS, DIFFICULTIES, PROJECT_STATUSES } from '@/utils/constants';
import { titleCase } from '@/utils/format';

const toOptions = (values) => values.map((v) => ({ value: v, label: titleCase(v) }));

const ProjectFilters = () => {
  const dispatch = useDispatch();
  const filters = useSelector(selectProjectFilters);
  const [search, setSearch] = useState(filters.search);
  const [expanded, setExpanded] = useState(false);

  const debouncedSearch = useDebounce(search, 400);

  useEffect(() => {
    if (debouncedSearch !== filters.search) dispatch(setFilter({ search: debouncedSearch }));
  }, [debouncedSearch, filters.search, dispatch]);

  const hasActiveFilters =
    filters.status || filters.domain || filters.difficulty || filters.search;

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search your projects…"
          leftIcon={<Search className="h-4 w-4" />}
          rightElement={
            search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="Clear search"
                className="rounded p-1 text-content-muted hover:text-content-primary"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )
          }
        />
        <Button
          variant={expanded ? 'outline' : 'secondary'}
          size="icon"
          onClick={() => setExpanded((v) => !v)}
          aria-label="Toggle filters"
          aria-expanded={expanded}
        >
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
      </div>

      {expanded && (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <Select
            value={filters.status}
            onChange={(e) => dispatch(setFilter({ status: e.target.value }))}
            placeholder="All statuses"
            options={toOptions(PROJECT_STATUSES)}
          />
          <Select
            value={filters.domain}
            onChange={(e) => dispatch(setFilter({ domain: e.target.value }))}
            placeholder="All domains"
            options={toOptions(DOMAINS)}
          />
          <Select
            value={filters.difficulty}
            onChange={(e) => dispatch(setFilter({ difficulty: e.target.value }))}
            placeholder="Any difficulty"
            options={toOptions(DIFFICULTIES)}
          />
          <Select
            value={filters.sort}
            onChange={(e) => dispatch(setFilter({ sort: e.target.value }))}
            options={[
              { value: '-updatedAt', label: 'Recently updated' },
              { value: '-createdAt', label: 'Newest first' },
              { value: 'createdAt', label: 'Oldest first' },
              { value: 'title', label: 'Title A–Z' },
              { value: 'deadline', label: 'Deadline' },
            ]}
          />
        </div>
      )}

      {hasActiveFilters && (
        <button
          type="button"
          onClick={() => {
            setSearch('');
            dispatch(resetFilters());
          }}
          className="text-xs font-medium text-primary-400 transition-colors hover:text-primary-500"
        >
          Clear all filters
        </button>
      )}
    </div>
  );
};

export default ProjectFilters;
