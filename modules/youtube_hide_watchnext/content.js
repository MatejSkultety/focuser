(() => {
  const stateKey = '__focuserYTHideWatchNext';
  const root = document.documentElement;

  const isYouTubeWatch = () => {
    const host = window.location.hostname;
    return (host === 'www.youtube.com' || host === 'youtube.com') &&
      window.location.pathname === '/watch';
  };

  const setWatchState = (enabled) => {
    if (enabled && isYouTubeWatch()) {
      root.setAttribute('data-focuser-yt-watch', 'true');
    } else {
      root.removeAttribute('data-focuser-yt-watch');
    }
  };

  if (window[stateKey]?.initialized) {
    window[stateKey].refresh();
    return;
  }

  const controller = {
    initialized: true,
    enabled: true,
    setEnabled(enabled) {
      this.enabled = Boolean(enabled);
      setWatchState(this.enabled);
    },
    refresh() {
      setWatchState(this.enabled);
    }
  };

  window[stateKey] = controller;

  const handleNavigation = () => controller.refresh();
  window.addEventListener('yt-navigate-finish', handleNavigation, true);
  document.addEventListener('yt-navigate-finish', handleNavigation, true);
  window.addEventListener('popstate', handleNavigation, true);

  controller.refresh();
})();
