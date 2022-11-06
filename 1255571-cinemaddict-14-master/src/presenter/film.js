import FilmCardView from '../view/film-card';
import FilmFormPopupView from '../view/film-form-popup';
import FilmPopupView from '../view/film-popup';
import FilmComments from '../view/film-comments';
import {render, replace, remove} from '../utils/render';
import {Places, UserAction, UpdateType} from '../const';

export default class Film {
  constructor(bodySite, filmListContainer, changeData, api, addPopup, removeFilmPopup) {
    this._siteBodyElement = bodySite;
    this._filmListContainer = filmListContainer;
    this._changeData = changeData;
    this._isPopupOpen = false;

    this._filmComponent = null;
    this._filmPopupComponent = null;
    this._filmPopupCommentsComponent = null;
    this._filmFormPopupComponent = new FilmFormPopupView();

    this._api = api;

    this._handleFavoriteClick = this._handleFavoriteClick.bind(this);
    this._handleWatchlistClick = this._handleWatchlistClick.bind(this);
    this._handleWatchedClick = this._handleWatchedClick.bind(this);

    this._onEscKeyDown = this._onEscKeyDown.bind(this);
    this._closePopup = this._closePopup.bind(this);

    this._addCommentHandler = this._addCommentHandler.bind(this);
    this._deleteCommentHandler = this._deleteCommentHandler.bind(this);

    this._addPopup = addPopup;
    this._removeFilmPopup = removeFilmPopup;
  }

  init(film, container) {
    this._film = film;

    const prevFilmComponent = this._filmComponent;
    const prevFilmPopupComponent = this._filmPopupComponent;

    this._filmComponent = new FilmCardView(film);
    this._filmPopupComponent = new FilmPopupView(film);

    this._filmComponent.setFavoriteClickHandler(this._handleFavoriteClick);
    this._filmComponent.setWatchlistClickHandler(this._handleWatchlistClick);
    this._filmComponent.setWatchedClickHandler(this._handleWatchedClick);

    this._filmPopupComponent.setFavoriteClickHandler(this._handleFavoriteClick);
    this._filmPopupComponent.setWatchlistClickHandler(this._handleWatchlistClick);
    this._filmPopupComponent.setWatchedClickHandler(this._handleWatchedClick);

    this._filmComponent.setClickHandler(() => {
      this._openPopup();
      document.addEventListener('keydown', this._onEscKeyDown);
    });

    if (prevFilmComponent === null || prevFilmPopupComponent === null) {
      render(container.getContainerForRender(), this._filmComponent, Places.BEFOREEND);

      return;
    }

    if (container.getElement().contains(prevFilmComponent.getElement())) {
      replace(this._filmComponent, prevFilmComponent);
    }

    if (this._filmFormPopupComponent.getElement().contains(prevFilmPopupComponent.getElement())) {
      replace(this._filmPopupComponent, prevFilmPopupComponent);
      this._renderComments();
      this._filmPopupComponent.setClickHandler(this._closePopup);
    }

    remove(prevFilmComponent);
    remove(prevFilmPopupComponent);

  }

  destroy() {
    remove(this._filmComponent);
  }

  removeAllPopups() {
    if (this._filmPopupCommentsComponent !== null) {
      this._filmPopupCommentsComponent.removeFormSubmitHandler();
    }
    document.removeEventListener('keydown', this._onEscKeyDown);
    this._siteBodyElement.querySelectorAll('.film-details').forEach((element) => {
      element.remove();
    });
  }

  _renderComments() {
    this._api.getComments(this._film.id).then((response) => {
      const prevFilmPopupCommentsComponent = this._filmPopupCommentsComponent;

      this._filmPopupCommentsComponent = new FilmComments(response);
      this._filmPopupCommentsComponent.setFormSubmitHandler(this._addCommentHandler);
      this._filmPopupCommentsComponent.setCommentDelateHandler(this._deleteCommentHandler);

      const filmDetailsElement = this._filmFormPopupComponent.getElement().querySelector('.film-details__inner');

      if (prevFilmPopupCommentsComponent === null) {
        render(filmDetailsElement, this._filmPopupCommentsComponent, Places.BEFOREEND);

        return;
      }

      if (this._filmFormPopupComponent.getElement().contains(prevFilmPopupCommentsComponent.getElement())) {
        replace(this._filmPopupCommentsComponent, prevFilmPopupCommentsComponent);
      }

      render(filmDetailsElement, this._filmPopupCommentsComponent, Places.BEFOREEND);
      prevFilmPopupCommentsComponent.removeFormSubmitHandler();
      prevFilmPopupCommentsComponent.removeCommentDeleteHandler();

      remove(prevFilmPopupCommentsComponent);

    });
  }

  _removePopup() {
    this._filmFormPopupComponent.setPopupClose(this._siteBodyElement);
    this._filmFormPopupComponent.getElement().remove();
    this._filmPopupCommentsComponent.getElement().remove();
    this._filmPopupCommentsComponent.removeFormSubmitHandler();
    this._removeFilmPopup();
    this._isPopupOpen = false;
  }

  _closePopup() {
    this._removePopup();
    document.removeEventListener('keydown', this._onEscKeyDown);
  }

  _openPopup() {
    this._isPopupOpen = true;
    this.removeAllPopups();
    this._addPopup(this._film.id);
    render(this._filmListContainer, this._filmFormPopupComponent, Places.BEFOREEND);
    render(this._filmFormPopupComponent.getElement().querySelector('.film-details__inner'), this._filmPopupComponent, Places.BEFOREEND);
    this._renderComments();
    this._filmFormPopupComponent.setPopupOpen(this._siteBodyElement);

    this._filmPopupComponent.setClickHandler(this._closePopup);
  }

  setSaving() {
    this._filmPopupCommentsComponent.updateData({
      isSaving: true,
    });
  }

  setDeleting(commentId) {
    this._filmPopupCommentsComponent.updateData({
      isDeleting: true,
      deletingCommentId: commentId,
    });
  }

  resetFormState() {
    this._filmPopupCommentsComponent.shakeForm(() => {
      this._filmPopupCommentsComponent.updateData({
        isSaving: false,
      });
    });
  }

  resetDeleteState(commentId) {
    this._filmPopupCommentsComponent.shakeComment(() => {
      this._filmPopupCommentsComponent.updateData({
        isDeleting: false,
      });
    }, commentId);
  }

  _onEscKeyDown(evt) {
    if (evt.key === 'Escape' || evt.key === 'Esc') {
      evt.preventDefault();
      this._removePopup();
      document.removeEventListener('keydown', this._onEscKeyDown);
    }
  }

  _handleFavoriteClick() {
    this._changeData(
      UserAction.UPDATE_FILM,
      UpdateType.MINOR,
      Object.assign(
        {},
        this._film,
        this._film.userDetails.favorite = !this._film.userDetails.favorite,
      ),
    );
  }

  _handleWatchlistClick() {
    this._changeData(
      UserAction.UPDATE_FILM,
      UpdateType.MINOR,
      Object.assign(
        {},
        this._film,
        this._film.userDetails.watchlist = !this._film.userDetails.watchlist,
      ),
    );
  }

  _handleWatchedClick() {
    this._changeData(
      UserAction.UPDATE_FILM,
      UpdateType.MINOR,
      Object.assign(
        {},
        this._film,
        this._film.userDetails.alreadyWatched = !this._film.userDetails.alreadyWatched,
        this._film.userDetails.watchingDate = new Date().toISOString(),
      ),
    );
  }

  _addCommentHandler(newComment) {
    this._changeData(
      UserAction.ADD_COMMENT,
      UpdateType.MINOR,
      Object.assign(
        {},
        {
          comment: newComment.commentText,
          emotion: newComment.emotion,
        },
        {
          id: this._film.id,
        },
      ),
    );
  }

  _deleteCommentHandler(commentId) {
    this._changeData(
      UserAction.DELETE_COMMENT,
      UpdateType.MINOR,
      Object.assign(
        {},
        {
          commentId: commentId,
        },
        {
          id: this._film.id,
        },
      ),
    );
  }

  hide() {
    this._filmComponent.hide();
  }

  show() {
    this._filmComponent.show();
  }
}
