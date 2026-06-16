import { query } from '@/lib/db';

export async function updateQualityScores(): Promise<void> {
  await query(`
    UPDATE sources s SET quality_score = sub.score
    FROM (
      SELECT
        a.source_id,
        LEAST(1.0, COUNT(*)::real / 30.0)
          * LEAST(1.0, COALESCE(AVG(LENGTH(a.content)), 0)::real / 1000.0)
          * LEAST(1.0, COUNT(DISTINCT DATE(a.published_at))::real / 7.0) AS score
      FROM articles a
      WHERE a.published_at > NOW() - INTERVAL '30 days'
      GROUP BY a.source_id
    ) sub
    WHERE s.id = sub.source_id
  `);
}
