import { ChargeMensuelle } from "@/components/dashboard/charts/charge-mensuelle";
import { PaymentsOverview } from "@/components/Charts/payments-overview";
import StatusPieChart from "@/components/dashboard/components/StatusPieChart";
import { TopChannels } from "@/components/Tables/top-channels";
import { TopChannelsSkeleton } from "@/components/Tables/top-channels/skeleton";
import { createTimeFrameExtractor } from "@/utils/timeframe-extractor";
import { Suspense } from "react";
import { ChatsCard } from "./_components/chats-card";
import { OverviewCardsSkeleton } from "./_components/overview-cards/skeleton";
import { DashboardKPICardsWithFilters } from "./_components/overview-cards/dashboard-kpi-cards-with-filters";
import { HomeDashboardSection } from "@/components/dashboard/components/HomeDashboardSection";

type PropsType = {
  searchParams: Promise<{
    selected_time_frame?: string;
  }>;
};

export default async function Home({ searchParams }: PropsType) {
  const { selected_time_frame } = await searchParams;
  const extractTimeFrame = createTimeFrameExtractor(selected_time_frame);

  return (
    <>
      {/* Section Dashboard Atelier avec StatusPieChart inclus */}
      <div className="mt-6">
        <HomeDashboardSection />
      </div>

      {/* PaymentsOverview centralisé */}
      <div className="mt-4 md:mt-6 2xl:mt-9">
        <div className="flex justify-center">
          <div className="w-full max-w-5xl">
            <PaymentsOverview
              key="payments-overview-chart"
              timeFrame={extractTimeFrame("payments_overview")?.split(":")[1]}
            />
          </div>
        </div>
      </div>
    </>
  );
}