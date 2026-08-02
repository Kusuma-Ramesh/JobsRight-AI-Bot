import { Action } from './Action.js';
import { ActivityType } from './../../../workflow/activities/ActivityType.js';
import { UploadFailedError } from './../utils/Errors.js';
import { WaitState } from './../dom/WaitState.js';

/**
 * Attach a file to an `<input type="file">`.
 *
 * **A file path is not enough, and cannot be.** Page JavaScript has no filesystem access:
 * nothing running in a page can turn `'/home/user/resume.pdf'` into a file. Only two things
 * can produce one — an extension background context that fetched or read the bytes, or the
 * user picking the file themselves. So this action takes a `File`/`Blob`, or bytes plus a
 * name, and treats a bare path as a caller error rather than silently attaching nothing.
 *
 * Given real content, the attachment is genuine: a `DataTransfer` builds a `FileList`,
 * which is the only way to populate `input.files` — the property is read-only and cannot be
 * assigned. `change` is then dispatched, since a form that never sees it will not register
 * the upload.
 *
 * A file input is very often visually hidden behind a styled button, so interactability is
 * deliberately **not** required — only presence. Demanding visibility would reject the
 * majority of real upload controls.
 */
export class UploadFileAction extends Action {
  constructor(options) {
    super({ ...options, type: ActivityType.UploadFile });
  }

  /** @returns {string} */
  get requiredState() {
    return WaitState.Present;
  }

  /**
   * @param {import('./../models/DomElement.js').DomElement} element
   * @param {object} params
   * @param {File|Blob} [params.file]     The file to attach.
   * @param {File[]} [params.files]       Several, for a `multiple` input.
   * @param {BlobPart} [params.content]   Raw content, when building the file here.
   * @param {string} [params.fileName]    Name to give `content`.
   * @param {string} [params.mimeType]    Type for `content`.
   * @param {string} [params.filePath]    Accepted only to produce a clear error: a path
   *                                      cannot be read from a page.
   * @returns {object} `{ selector, fileNames, fileCount }`
   * @throws {UploadFailedError} `UPLOAD_FAILED` when the target is not a file input, when
   *         only a path was supplied, or when the browser exposes no `DataTransfer`.
   */
  perform(element, { file = null, files = null, content = null, fileName = null, mimeType = 'application/octet-stream', filePath = null } = {}) {
    const node = this.nodeOf(element);
    const label = element.describe();

    if ((node.type ?? '').toLowerCase() !== 'file') {
      throw new UploadFailedError(`${label} is not a file input.`, { selector: label, type: node.type ?? null });
    }

    const payload = this.toFiles({ file, files, content, fileName, mimeType, filePath, selector: label });

    if (payload.length > 1 && node.multiple !== true) {
      throw new UploadFailedError(`${label} accepts one file, but ${payload.length} were supplied.`, { selector: label, fileCount: payload.length });
    }

    const DataTransferCtor = this.window?.DataTransfer;
    if (typeof DataTransferCtor !== 'function') {
      throw new UploadFailedError('This context provides no DataTransfer, so a FileList cannot be built.', { selector: label });
    }

    const transfer = new DataTransferCtor();
    for (const item of payload) transfer.items.add(item);
    node.files = transfer.files;

    this.dispatchEvent(node, 'input');
    this.dispatchEvent(node, 'change');

    if (node.files?.length !== payload.length) {
      throw new UploadFailedError(`${label} did not accept the file.`, { selector: label, attached: node.files?.length ?? 0 });
    }

    return { selector: label, fileNames: payload.map((item) => item.name), fileCount: payload.length };
  }

  /**
   * Normalise the supported inputs into a list of files.
   *
   * @param {object} params
   * @returns {File[]}
   * @throws {UploadFailedError} `UPLOAD_FAILED` when no usable content was supplied.
   */
  toFiles({ file, files, content, fileName, mimeType, filePath, selector }) {
    if (Array.isArray(files) && files.length > 0) return files;
    if (file) return [file];

    if (content !== null && content !== undefined) {
      const FileCtor = this.window?.File;
      if (typeof FileCtor !== 'function') {
        throw new UploadFailedError('This context provides no File constructor.', { selector });
      }
      if (!fileName) {
        throw new UploadFailedError('Uploading raw content requires a fileName.', { selector });
      }
      return [new FileCtor([content], fileName, { type: mimeType })];
    }

    if (filePath) {
      throw new UploadFailedError(
        `A file path cannot be read from a page context. Read '${filePath}' in the extension background and pass 'file' or 'content'.`,
        { selector, filePath }
      );
    }

    throw new UploadFailedError('uploadFile requires a file, files, or content.', { selector });
  }
}

export default UploadFileAction;
