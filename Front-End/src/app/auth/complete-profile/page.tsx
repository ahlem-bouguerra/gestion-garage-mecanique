
import { createTimeFrameExtractor } from "@/utils/timeframe-extractor";
import { Metadata } from "next";
import CompleteProfilePage from "@/components/Auth/complete-profile";


export const metadata: Metadata = {
  title: "Basic Chart",
};

type PropsType = {
  searchParams: Promise<{
    selected_time_frame?: string;
  }>;
};

export default async function Page(props: PropsType) {
  const { selected_time_frame } = await props.searchParams;
  const extractTimeFrame = createTimeFrameExtractor(selected_time_frame);

  return (
    <>

      <div>

        <div className="col-span-12 xl:col-span-5">
          <CompleteProfilePage />
        </div>
      </div>
    </>
  );
}
