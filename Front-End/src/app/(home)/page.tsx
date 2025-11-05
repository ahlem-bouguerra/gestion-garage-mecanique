import { ChargeMensuelle } from "@/components/dashboard/charts/charge-mensuelle";
import { PaymentsOverview } from "@/components/Charts/payments-overview";
import { UsedDevices } from "@/components/Charts/used-devices";
import { WeeksProfit } from "@/components/Charts/weeks-profit";
import { TopChannels } from "@/components/Tables/top-channels";
import { TopChannelsSkeleton } from "@/components/Tables/top-channels/skeleton";
import { createTimeFrameExtractor } from "@/utils/timeframe-extractor";
import { Suspense } from "react";
import { ChatsCard } from "./_components/chats-card";
import { OverviewCardsGroup } from "./_components/overview-cards";
import { OverviewCardsSkeleton } from "./_components/overview-cards/skeleton";
import { RegionLabels } from "./_components/region-labels";
import { DashboardKPICardsWithFilters } from "./_components/overview-cards/dashboard-kpi-cards-with-filters";

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
      <Suspense fallback={<OverviewCardsSkeleton />}>
        <DashboardKPICardsWithFilters />
      </Suspense>

      <div className="mt-4 grid grid-cols-12 gap-4 md:mt-6 md:gap-6 2xl:mt-9 2xl:gap-7.5">
        <ChargeMensuelle
          className="col-span-12 xl:col-span-7"
          key="charge-mensuelle-chart" // ✅ Clé unique et statique
          timeFrame={extractTimeFrame("payments_overview")?.split(":")[1]}
        />

        <WeeksProfit
          key="weeks-profit-chart" // ✅ Clé unique et statique
          timeFrame={extractTimeFrame("weeks_profit")?.split(":")[1]}
          className="col-span-12 xl:col-span-5"
        />

        <PaymentsOverview
          className="col-span-12 xl:col-span-7"
          key="payments-overview-chart" // ✅ Clé unique et statique
          timeFrame={extractTimeFrame("payments_overview")?.split(":")[1]}
        />

        <UsedDevices
          className="col-span-12 xl:col-span-5"
          key="used-devices-chart" // ✅ Clé unique et statique
          timeFrame={extractTimeFrame("used_devices")?.split(":")[1]}
        />

        <div className="col-span-12 grid xl:col-span-8">
          <Suspense fallback={<TopChannelsSkeleton />}>
            <TopChannels />
          </Suspense>
        </div>

        <Suspense fallback={null}>
          <ChatsCard />
        </Suspense>
      </div>
    </>
  );
}