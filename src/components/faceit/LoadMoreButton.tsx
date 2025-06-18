
import { Button } from "@/components/ui/button";

interface LoadMoreButtonProps {
  loading: boolean;
  onLoadMore: () => void;
}

export const LoadMoreButton = ({ loading, onLoadMore }: LoadMoreButtonProps) => {
  return (
    <div className="text-center pt-4 sm:pt-6">
      <Button
        onClick={onLoadMore}
        disabled={loading}
        className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-0 px-6 sm:px-8 py-2 sm:py-3 text-sm sm:text-base"
      >
        {loading ? 'Se încarcă...' : 'Încarcă mai mulți'}
      </Button>
    </div>
  );
};
