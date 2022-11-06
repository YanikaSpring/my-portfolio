import dayjs from 'dayjs';
import he from 'he';
import Smart from './smart';

const SHAKE_ANIMATION_TIMEOUT = 600;
const SNAKE_CLASS = `shake ${SHAKE_ANIMATION_TIMEOUT / 1000}s`;
const EMOJIS_LIST = ['smile', 'sleeping', 'puke', 'angry'];
const CODE_ENTER_KEY = 13;

const createCommentList = ({comments, isDeleting, isSaving, newEmojiText, deletingCommentId, currentEmoji}) => {

  return (
    `<div class="film-details__bottom-container">
          <section class="film-details__comments-wrap">
            <h3 class="film-details__comments-title">Comments <span class="film-details__comments-count">${comments.length}</span></h3>

            <ul class="film-details__comments-list">
     ${comments.length > 0 ? comments.map((comment) => createCommentTemplate(comment, isDeleting, deletingCommentId)).join('') : ''}
            </ul>

            <div class="film-details__new-comment">
              <div class="film-details__add-emoji-label">
                ${currentEmoji === null ? '' : `<img src="./images/emoji/${currentEmoji}.png" width="55" height="55" alt="emoji">`}
              </div>
              <label class="film-details__comment-label">
                <textarea class="film-details__comment-input" placeholder="Select reaction below and write comment here" name="comment" ${isSaving ? 'disabled' : ''}>${he.encode(newEmojiText)}</textarea>
              </label>

            <div class="film-details__emoji-list">
              ${EMOJIS_LIST.map((emoji) => `<input class="film-details__emoji-item visually-hidden" name="comment-emoji" type="radio" id="emoji-${emoji}" value=${emoji} ${isSaving ? 'disabled' : ''}>
                                            <label class="film-details__emoji-label" for="emoji-${emoji}">
                                              <img src="./images/emoji/${emoji}.png" width="30" height="30" alt="emoji">
                                            </label>`).join('')}

            </div>
          </section>
        </div>`
  );
};

const createCommentTemplate = (comment, isDeleting, deletingCommentId) => {
  const commentDate = dayjs(comment.date).format('YYYY/MM/DD hh:mm');
  return (
    `<li id='${commentDate}_${comment.comment}' class="film-details__comment">
      <span class="film-details__comment-emoji">
        <img src="./images/emoji/${comment.emotion}.png" width="55" height="55" alt="emoji-smile">
      </span>
      <div>
        <p class="film-details__comment-text">${comment.comment}</p>
        <p class="film-details__comment-info">
          <span class="film-details__comment-author">${comment.author}</span>
          <span class="film-details__comment-day">${commentDate}</span>
          <button class="film-details__comment-delete" data-comment-index=${comment.id} ${isDeleting && comment.id === deletingCommentId ? 'disabled' : ''}>${isDeleting && comment.id === deletingCommentId ? 'Deleting...' : 'Delete'}</button>
        </p>
      </div>
    </li>`
  );
};

export default class FilmComments extends Smart {
  constructor(comments) {
    super();
    this._data = FilmComments.parseCommentToData(comments);
    this._addNewEmojiHandler = this._addNewEmojiHandler.bind(this);
    this._commentInputHandler = this._commentInputHandler.bind(this);

    this._formSubmitHandler = this._formSubmitHandler.bind(this);

    this._commentDeleteHandler = this._commentDeleteHandler.bind(this);
    this._setInnerHandlers();
  }

  getTemplate() {
    return createCommentList(this._data);
  }

  restoreHandlers() {
    this._setInnerHandlers();
  }

  setFormSubmitHandler(callback) {
    this._callback.formSubmit = callback;
    document.addEventListener('keydown', this._formSubmitHandler);
  }

  removeFormSubmitHandler() {
    document.removeEventListener('keydown', this._formSubmitHandler);
  }

  removeCommentDeleteHandler() {
    document.removeEventListener('keydown', this._commentDeleteHandler);
  }

  setCommentDelateHandler(callback) {
    this._callback.commentDelate = callback;
    const delateButtons = this.getElement().querySelectorAll('.film-details__comment-delete');
    delateButtons.forEach((element) => {
      element.addEventListener('click', this._commentDeleteHandler);
    });
  }

  shakeForm(callback = null) {
    this.getElement().querySelector('.film-details__new-comment').style.animation = SNAKE_CLASS;
    setTimeout(() => {
      this.getElement().querySelector('.film-details__new-comment').style.animation = '';
      if (callback !== null) {
        callback();
      }
    }, SHAKE_ANIMATION_TIMEOUT);
  }

  shakeComment(callback, deletingCommentId) {
    const deletingElement = Array.from(this.getElement().querySelectorAll('.film-details__comment')).find((element) => {
      return element.querySelector('.film-details__comment-delete').dataset.commentIndex === deletingCommentId;
    });

    deletingElement.style.animation = SNAKE_CLASS;
    setTimeout(() => {
      deletingElement.style.animation = '';
      callback();
    }, SHAKE_ANIMATION_TIMEOUT);
  }

  _setInnerHandlers() {
    this.getElement().querySelectorAll('.film-details__emoji-item')
      .forEach((element) => {
        element.addEventListener('change', this._addNewEmojiHandler);
      });
    this.getElement().querySelector('.film-details__comment-input').addEventListener('input', this._commentInputHandler);
  }

  _formSubmitHandler(evt) {
    if ((evt.ctrlKey && evt.keyCode === CODE_ENTER_KEY) || (evt.metaKey && evt.keyCode === CODE_ENTER_KEY)) {
      evt.preventDefault();
      if (this._data.currentEmoji === null || this._data.newEmojiText === '' || this._data.newEmojiText.trim() === '') {
        this.shakeForm();
        return;
      }

      this._data.newEmojiText.trim();
      this._callback.formSubmit(FilmComments.parseDataToNewComment(this._data));
    }
  }

  _commentDeleteHandler(evt) {
    evt.preventDefault();
    this._callback.commentDelate(evt.target.dataset.commentIndex);
  }

  _addNewEmojiHandler(evt) {
    evt.preventDefault();
    this.updateData({
      currentEmoji: evt.target.value,
    });
  }

  _commentInputHandler(evt) {
    evt.preventDefault();
    this.updateData({
      newEmojiText: evt.target.value,
    }, true);
  }

  static parseCommentToData(comments) {
    return Object.assign(
      {},
      {
        comments: comments,
      },
      {
        newEmojiText: '',
        isSaving: false,
        isDeleting: false,
        deletingCommentId: null,
        currentEmoji: null,
      },
    );
  }

  static parseDataToNewComment(data) {
    return {
      commentText: data.newEmojiText,
      emotion: data.currentEmoji,
    };
  }
}
