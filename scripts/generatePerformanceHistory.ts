import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const YEARS = [2022, 2023, 2024, 2025];

function clamp(num: number, min: number, max: number) {
    return Math.max(min, Math.min(max, num));
}

function round(num: number) {
    return Math.round(num * 10) / 10;
}

async function main() {
    console.log("Fetching MPs...");

    const { data: mps, error } = await supabase
        .from("mps")
        .select("*");

    if (error) throw error;

    console.log(`Found ${mps.length} MPs`);

    const rows: any[] = [];

    for (const mp of mps) {

        const attendance = Number(mp.attendance_rate ?? 0);
        const questions = Number(mp.questions_count ?? 0);
        const debates = Number(mp.debates_count ?? 0);
        const bills = Number(mp.bills_sponsored ?? 0);
        const score = Number(mp.overall_score ?? 0);

        YEARS.forEach((year, index) => {

            const progress = (index + 1) / YEARS.length;

            rows.push({
                mp_id: mp.id,
                year,

                attendance_rate: round(
                    clamp(
                        attendance * (0.78 + progress * 0.22),
                        25,
                        100
                    )
                ),

                questions_count: Math.round(
                    questions * progress
                ),

                debates_count: Math.round(
                    debates * progress
                ),

                bills_sponsored: Math.round(
                    bills * progress
                ),

                overall_score: round(
                    clamp(
                        score * (0.75 + progress * 0.25),
                        0,
                        100
                    )
                )
            });

        });

    }

    console.log(`Generated ${rows.length} rows`);

    const { error: insertError } = await supabase
        .from("mp_performance_history")
        .insert(rows);

    if (insertError) throw insertError;

    console.log("Done!");
}

main().catch(console.error);