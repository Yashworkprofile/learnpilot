import Link from "next/link";
import { Play, CirclePlay } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import type { CourseSection, CurrentPosition } from "@/lib/types";

interface UpNextCardProps {
  currentPosition: CurrentPosition | null;
  sections: CourseSection[];
  /** lecture_id of the current resume point — used to link into Workspace. */
  lectureId: number | null;
}

export function UpNextCard({ currentPosition, sections, lectureId }: UpNextCardProps) {
  return (
    <GlassCard
      variant="glass-strong"
      animate
      className="p-5 mb-3 relative overflow-hidden"
    >
      <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-violet-500/25 blur-3xl" />
      <div className="flex items-center gap-4 relative">
        <div className="h-12 w-12 rounded-xl grad-accent flex items-center justify-center shrink-0 glow">
          <Play className="h-5 w-5 text-white fill-white" />
        </div>

        {currentPosition ? (
          <>
            <div className="min-w-0 flex-1">
              <Eyebrow currentPosition={currentPosition} sections={sections} />
              <h3 className="text-sm font-semibold text-white truncate">
                {currentPosition.subsection_title}
              </h3>
            </div>
            <Link
              href={lectureId ? `/workspace?lecture_id=${lectureId}` : "/workspace"}
              className="shrink-0 inline-flex items-center gap-2 rounded-xl grad-accent px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition glow"
            >
              <CirclePlay className="h-4 w-4" /> Resume
            </Link>
          </>
        ) : (
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-indigo-200">
              Up Next
            </span>
            <h3 className="text-sm font-semibold text-white">
              All caught up — nothing left to resume.
            </h3>
          </div>
        )}
      </div>
    </GlassCard>
  );
}

function Eyebrow({
  currentPosition,
  sections,
}: {
  currentPosition: CurrentPosition;
  sections: CourseSection[];
}) {
  const section = sections.find(
    (s) => s.title === currentPosition.section_title
  );
  const lessonNumber = section
    ? section.subsections.findIndex(
        (sub) => sub.title === currentPosition.subsection_title
      ) + 1
    : 0;

  return (
    <div className="flex items-center gap-2 mb-0.5">
      <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-indigo-200">
        Up Next
      </span>
      {section && (
        <>
          <span className="text-[10px] text-white/30">·</span>
          <span className="text-[10px] text-white/40">
            Week {section.section_index}
            {lessonNumber > 0 ? ` · Lesson ${lessonNumber}` : ""}
          </span>
        </>
      )}
    </div>
  );
}