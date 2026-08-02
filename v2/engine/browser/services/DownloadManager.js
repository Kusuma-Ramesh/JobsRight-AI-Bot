import { NotImplementedError } from './../utils/Errors.js';

/**
 * Tracks files leaving and entering the browser.
 *
 * Downloads are asynchronous and only loosely tied to the click that triggered them, so the
 * engine cannot treat "clicked the download link" as "the file exists". This service owns
 * correlating a trigger with its resulting file, waiting for completion, and returning a
 * concrete path under `v2/data/`. Uploads are handled here too, since both are file-transfer
 * concerns with the same verification problem.
 */
export class DownloadManager {
  /**
   * @param {object} [options]
   * @param {string} [options.downloadDir] Destination directory, under `v2/data/`.
   * @param {object} [options.timeoutService] `TimeoutService` instance.
   * @param {object} [options.eventService]   `EventService` instance.
   * @param {object} [options.logger]         `Logger` instance.
   */
  constructor({ downloadDir = 'v2/data/temp', timeoutService = null, eventService = null, logger = null } = {}) {
    this.downloadDir = downloadDir;
    this.timeoutService = timeoutService;
    this.eventService = eventService;
    this.logger = logger;
  }

  /**
   * Run an action expected to trigger a download, and resolve once the file is complete.
   *
   * @param {() => Promise<void>} trigger Action that starts the download.
   * @param {object} [options]
   * @param {number} [options.timeout]
   * @param {string} [options.expectedFilename]
   * @returns {Promise<{ id: string, path: string, filename: string, bytes: number }>}
   */
  async expectDownload(trigger, options) {
    // TODO: subscribe to download events *before* invoking the trigger, to avoid a race.
    // TODO: correlate the started download with this trigger and await completion.
    throw new NotImplementedError('DownloadManager.expectDownload');
  }

  /**
   * Wait for an already-started download to finish.
   * @param {string} downloadId
   * @param {number} [timeout]
   * @returns {Promise<object>}
   */
  async waitForCompletion(downloadId, timeout) {
    // TODO: poll or subscribe until the state is complete, interrupted, or timed out.
    throw new NotImplementedError('DownloadManager.waitForCompletion');
  }

  /**
   * Supply a local file to a file input.
   * @param {object} target Resolved element reference from `SelectorResolver`.
   * @param {string} filePath Absolute path to the file to upload.
   * @returns {Promise<void>}
   */
  async uploadFile(target, filePath) {
    // TODO: verify the file exists and is readable before attempting the upload.
    // TODO: verify the input reports the file afterwards; a silent no-op is the common
    //       failure mode for programmatic file inputs.
    throw new NotImplementedError('DownloadManager.uploadFile');
  }

  /**
   * Cancel an in-flight download.
   * @param {string} downloadId
   * @returns {Promise<void>}
   */
  async cancel(downloadId) {
    // TODO: implement.
    throw new NotImplementedError('DownloadManager.cancel');
  }

  /**
   * Remove artifacts written during a run.
   * @param {string} runId
   * @returns {Promise<void>}
   */
  async cleanup(runId) {
    // TODO: clear `v2/data/temp` for the run; never touch `resumes/` or `screenshots/`.
    throw new NotImplementedError('DownloadManager.cleanup');
  }
}

export default DownloadManager;
