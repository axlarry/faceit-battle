
interface EmptyLeaderboardStateProps {
  loading: boolean;
}

export const EmptyLeaderboardState = ({ loading }: EmptyLeaderboardStateProps) => {
  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="text-white">Se încarcă clasamentul...</div>
      </div>
    );
  }

  return (
    <div className="text-center py-8">
      <div className="text-gray-400">Nu s-au găsit jucători pentru această regiune.</div>
    </div>
  );
};
