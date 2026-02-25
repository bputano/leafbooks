interface AuthorHeaderProps {
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
}

export function AuthorHeader({ displayName, bio, avatarUrl }: AuthorHeaderProps) {
  return (
    <div className="flex items-center gap-4">
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={displayName}
          className="h-16 w-16 rounded-full object-cover"
        />
      ) : (
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-paper-warm font-serif text-xl font-semibold text-ink-light">
          {displayName.charAt(0).toUpperCase()}
        </div>
      )}
      <div>
        <h1 className="font-serif text-2xl font-semibold text-ink">{displayName}</h1>
        {bio && <p className="mt-1 text-sm text-ink-light">{bio}</p>}
      </div>
    </div>
  );
}
