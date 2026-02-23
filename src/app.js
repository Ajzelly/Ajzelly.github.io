import React, { useEffect, useMemo, useState } from 'https://esm.sh/react@18.3.1';
import { createRoot } from 'https://esm.sh/react-dom@18.3.1/client';

const h = React.createElement;
const GITHUB_USER = 'Ajzelly';

const formatDate = (value) =>
  new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

function App() {
  const [profile, setProfile] = useState(null);
  const [repos, setRepos] = useState([]);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('updated');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    const loadData = async () => {
      try {
        setLoading(true);

        const [profileResponse, reposResponse] = await Promise.all([
          fetch(`https://api.github.com/users/${GITHUB_USER}`, { signal: controller.signal }),
          fetch(`https://api.github.com/users/${GITHUB_USER}/repos?per_page=100&sort=updated`, {
            signal: controller.signal,
          }),
        ]);

        if (!profileResponse.ok || !reposResponse.ok) {
          throw new Error('Unable to reach GitHub API');
        }

        const profileData = await profileResponse.json();
        const reposData = await reposResponse.json();

        setProfile(profileData);
        setRepos(reposData.filter((repo) => !repo.fork));
      } catch (requestError) {
        if (requestError.name === 'AbortError') {
          return;
        }
        setError('Unable to load repositories right now. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadData();

    return () => controller.abort();
  }, []);

  const filteredRepos = useMemo(() => {
    const query = search.trim().toLowerCase();

    const visibleRepos = repos.filter((repo) => {
      if (!query) return true;
      const source = `${repo.name} ${repo.description ?? ''} ${repo.language ?? ''}`.toLowerCase();
      return source.includes(query);
    });

    const sorters = {
      updated: (a, b) => new Date(b.updated_at) - new Date(a.updated_at),
      stars: (a, b) => b.stargazers_count - a.stargazers_count,
      name: (a, b) => a.name.localeCompare(b.name),
    };

    return [...visibleRepos].sort(sorters[sortBy]);
  }, [repos, search, sortBy]);

  const languages = useMemo(() => {
    const counts = repos.reduce((acc, repo) => {
      if (!repo.language) return acc;
      acc[repo.language] = (acc[repo.language] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
  }, [repos]);

  const totalStars = useMemo(() => repos.reduce((sum, repo) => sum + repo.stargazers_count, 0), [repos]);

  const topProjects = useMemo(
    () => [...repos].sort((a, b) => b.stargazers_count - a.stargazers_count).slice(0, 3),
    [repos]
  );

  return h(
    'div',
    { className: 'page' },
    h('div', { className: 'backdrop glow-one' }),
    h('div', { className: 'backdrop glow-two' }),

    h(
      'header',
      { className: 'hero glass' },
      h(
        'div',
        { className: 'hero-main' },
        h('p', { className: 'eyebrow' }, 'Developer Portfolio'),
        h('h1', null, `${GITHUB_USER}'s GitHub Projects`),
        h(
          'p',
          { className: 'hero-copy' },
          'A refined React showcase for browsing code, technologies, and recent activity with a clean, modern interface.'
        ),
        h(
          'div',
          { className: 'hero-actions' },
          h(
            'a',
            { href: `https://github.com/${GITHUB_USER}`, target: '_blank', rel: 'noreferrer', className: 'btn primary' },
            'View GitHub Profile'
          ),
          h('span', { className: 'hint' }, 'Live data powered by GitHub API')
        )
      ),
      h(
        'aside',
        { className: 'profile-card' },
        profile?.avatar_url ? h('img', { src: profile.avatar_url, alt: `${GITHUB_USER} avatar` }) : null,
        h('h2', null, profile?.name || GITHUB_USER),
        h('p', null, profile?.bio || 'Full-stack builder and open-source enthusiast.'),
        h('small', null, `${profile?.followers ?? 0} followers · ${profile?.following ?? 0} following`)
      )
    ),

    h(
      'section',
      { className: 'stats' },
      h('article', { className: 'glass' }, h('h3', null, repos.length), h('p', null, 'Public Projects')),
      h('article', { className: 'glass' }, h('h3', null, totalStars), h('p', null, 'Total Stars')),
      h('article', { className: 'glass' }, h('h3', null, filteredRepos.length), h('p', null, 'Filtered Results')),
      h('article', { className: 'glass' }, h('h3', null, profile?.public_gists ?? 0), h('p', null, 'Public Gists'))
    ),

    h(
      'section',
      { className: 'top-projects glass' },
      h('h2', null, 'Featured Projects'),
      h(
        'div',
        { className: 'pill-row' },
        ...topProjects.map((repo) =>
          h(
            'a',
            { key: repo.id, href: repo.html_url, target: '_blank', rel: 'noreferrer', className: 'pill' },
            `${repo.name} · ⭐ ${repo.stargazers_count}`
          )
        )
      )
    ),

    h(
      'section',
      { className: 'controls glass' },
      h(
        'div',
        { className: 'control-search' },
        h('label', { htmlFor: 'search' }, 'Search projects'),
        h('input', {
          id: 'search',
          type: 'search',
          value: search,
          onChange: (event) => setSearch(event.target.value),
          placeholder: 'Name, description, or language',
        })
      ),
      h(
        'div',
        { className: 'control-sort' },
        h('label', { htmlFor: 'sort' }, 'Sort by'),
        h(
          'select',
          { id: 'sort', value: sortBy, onChange: (event) => setSortBy(event.target.value) },
          h('option', { value: 'updated' }, 'Recently Updated'),
          h('option', { value: 'stars' }, 'Most Starred'),
          h('option', { value: 'name' }, 'Alphabetical')
        )
      ),
      h(
        'div',
        { className: 'language-tags' },
        ...languages.map(([language, count]) => h('span', { key: language }, `${language} (${count})`))
      )
    ),

    h(
      'main',
      null,
      loading && h('p', { className: 'status' }, 'Loading repositories...'),
      error && !loading && h('p', { className: 'status error' }, error),
      !loading &&
        !error &&
        h(
          'section',
          { className: 'repo-grid', 'aria-live': 'polite' },
          filteredRepos.length > 0
            ? filteredRepos.map((repo) =>
                h(
                  'article',
                  { className: 'repo-card glass', key: repo.id },
                  h(
                    'div',
                    { className: 'repo-card-header' },
                    h('h3', null, repo.name),
                    h('span', null, repo.language || 'Unknown')
                  ),
                  h('p', null, repo.description || 'No description provided.'),
                  h(
                    'ul',
                    null,
                    h('li', null, `⭐ ${repo.stargazers_count}`),
                    h('li', null, `🍴 ${repo.forks_count}`),
                    h('li', null, `Updated ${formatDate(repo.updated_at)}`)
                  ),
                  h('a', { href: repo.html_url, target: '_blank', rel: 'noreferrer' }, 'Open Repository →')
                )
              )
            : h('p', { className: 'status' }, 'No repositories match your search.')
        )
    )
  );
}

createRoot(document.getElementById('root')).render(h(App));
