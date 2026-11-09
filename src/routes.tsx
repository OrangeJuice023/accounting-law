import { Route, Routes } from 'react-router-dom';
import { Shell } from './components/shell/Shell';
import { Dashboard } from './pages/Dashboard';
import { ReviewIndex } from './pages/ReviewIndex';
import { BlockPage } from './pages/BlockPage';
import { ModulePage } from './pages/ModulePage';
import { TopicPlaceholder } from './pages/TopicPlaceholder';
import { LessonPage } from './pages/LessonPage';
import { ProgressPage } from './pages/ProgressPage';
import { SearchPage } from './pages/SearchPage';
import { SourceLibrary } from './pages/SourceLibrary';
import { NotFound } from './pages/NotFound';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route index element={<Dashboard />} />
        <Route path="review" element={<ReviewIndex />} />
        <Route path="review/block-:blockCode" element={<BlockPage />} />
        <Route path="review/block-:blockCode/:moduleSlug" element={<ModulePage />} />
        <Route path="review/block-:blockCode/:moduleSlug/topic/:topicSlug" element={<TopicPlaceholder />} />
        <Route
          path="review/block-:blockCode/:moduleSlug/topic/:topicSlug/lesson/:lessonSlug"
          element={<LessonPage />}
        />
        <Route path="review/block-:blockCode/:moduleSlug/appendix/:appendixSlug" element={<LessonPage />} />
        <Route path="progress" element={<ProgressPage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="sources" element={<SourceLibrary />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
