export function formatFavoriteUsersCopy(favoriteUsersCount: number): string | null {
  if (favoriteUsersCount <= 0) return null;
  return favoriteUsersCount === 1
    ? "1 user's favourite coffee"
    : `${favoriteUsersCount} users' favourite coffee`;
}
