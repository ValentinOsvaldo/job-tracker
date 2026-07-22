import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';

const PING_INTERVAL_MS = 10 * 60 * 1000;
const PING_TIMEOUT_MS = 10_000;

/**
 * Render's free tier suspends a web service after ~15 min without inbound
 * HTTP traffic. Pinging the scraper's /health on a shorter interval keeps
 * it warm as long as this service itself is being pinged too (see the
 * GitHub Actions keep-alive workflow, which covers the case where both
 * services go idle at the same time).
 */
@Injectable()
export class KeepAliveService {
  private readonly logger = new Logger(KeepAliveService.name);

  @Interval(PING_INTERVAL_MS)
  async pingScraper() {
    const scraperUrl = (
      process.env.SCRAPER_URL || 'http://localhost:8000'
    ).replace(/\/$/, '');

    try {
      const response = await fetch(`${scraperUrl}/health`, {
        signal: AbortSignal.timeout(PING_TIMEOUT_MS),
      });
      this.logger.log(
        `Keep-alive ping to scraper (${scraperUrl}/health): ${response.status}`,
      );
    } catch (error) {
      this.logger.warn(
        `Keep-alive ping to scraper (${scraperUrl}/health) failed: ${(error as Error).message}`,
      );
    }
  }
}
