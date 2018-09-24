
/**
 * @author Vishal
 * @module main 
 * 
 */

const GITHUB_REPO_API_URL = "https://api.github.com/search/repositories?q=";
const GITHUB_STARRED_API_URL = "https://api.github.com/user/starred/";
const STARRED_REPO_API_URL = "https://api.github.com/users/testuservishal/starred"

const GITHUB_TOKEN = ""

// FIXME: Token should not be stored in plain text (should be moved to environment file)
const GITHUB_AUTH_HEADER = { "Authorization": `token ${GITHUB_TOKEN}` };

const GET_REQUEST = "GET";
const PUT_REQUEST = "PUT";
const DELETE_REQUEST = "DELETE";

// Maintains a list of favorite repo to avoid adding duplicate repo
let favoriteRepoList = [];


/**
 * @function addButton
 * @param {String} repoName 
 * @param {String} language 
 * @param {String} tag
 * @returns {String} button wrapped in td
 */
const addButton = (repoName, language, tag) => {
  return `<td><a class="addBtn" onClick='addRepoAsFavorite("${repoName}", "${language}", "${tag}")'>Add</a></td>`;
}


/**
 * @function removeButton
 * @param {String} repoName 
 * @param {String} language 
 * @param {String} tag 
 * @returns {String} button wrapped in td
 */
const removeButton = (repoName, language, tag) => {
  return `<td><a class="removeBtn" onClick='removeRepoFromFavorite("${repoName}", "${language}", "${tag}")'>Remove</a></td>`;
}


// Event handler for Enter key press to search repos when enter is pressed from input box
$(document).keyup(function (event) {
  if ($('#searchInput').is(":focus") && event.key == "Enter") {
    fetchRepos();
  }
});


/**
 * @function request
 * @param {String} requestType 
 * @param {String} url 
 * @param {Function} success 
 * @param {Function} error 
 */
const request = (requestType, url, success, error) => {
  $.ajax({
    url: url,
    type: requestType,
    cache: false,
    headers: GITHUB_AUTH_HEADER,
    success: (response) => {
      success(response);
    },
    error: () => {
      error();
    }
  });
}


/**
 * @function fetchRepos
 * @description Fetch list of repos based on search string
 */
const fetchRepos = () => {
  const searchString = $('#searchInput').val();
  if (!searchString) {
    return;
  }
  $('.repo-list tbody').find("tr:gt(0)").remove()

  request(GET_REQUEST,
    `${GITHUB_REPO_API_URL}${searchString}`,
    success = (response) => {
      addReposToDOM(response.items, addRepoToSearchList);
    },
    error = () => {
      showToastMessage("Failed to fetch search results!", false);
    });

}


/**
 * @function addReposToDOM
 * @description Add repos to the related table to display (DOM manipulation)
 */
const addReposToDOM = (data, addRepoFunction) => {
  data.forEach(element => {
    request(GET_REQUEST,
      element.tags_url,
      success = (tags) => {
        const tag = tags[0] && tags[0].name;
        addRepoFunction(element.full_name, element.language, tag ? tag : "", element.html_url);
      },
      error = () => {
      });
  });
}


/**
 * @function addRepoToSearchList
 * @param {String} repoName 
 * @param {String} language 
 * @param {String} tag 
 * @param {String} url 
 */
const addRepoToSearchList = (repoName, language, tag, url) => {

  let btn = addButton(repoName, language, tag);
  var found = favoriteRepoList.find((element) => {
    return element === repoName;
  });
  if (found) {
    btn = removeButton(repoName, language, tag);
  }
  const repoId = "repo-" + repoName.replace('/', '');
  let repo = `<tr id="${repoId}"><td><a target="_blank" href="${url}">${repoName}</a></td><td>${language}</td><td>${tag}</td>${btn}</tr>`;
  $('.repo-list').find('tbody').append(repo);
}

/**
 * @function removeRepoFromFavorite
 * @param {String} repoName 
 * @param {String} language 
 * @param {String} tag 
 * @param {String} url 
 */
const addRepoToFavoriteList = (repoName, language, tag, url) => {
  const favRepoId = repoName.replace('/', '');
  const removeBtn = removeButton(repoName, language, tag);
  const repo = `<tr id="${favRepoId}"><td><a target="_blank" href="${url}">${repoName}</a></td><td>${language}</td><td>${tag}</td>${removeBtn}</tr>`;
  $('.fav-repo-list').find('tbody').append(repo);
  const repoId = "repo-" + repoName.replace('/', '');
  $(`#${repoId} td:last-child`).remove();
  $(`#${repoId}`).append(removeButton(repoName, language, tag));
}

/**
 * @function addRepoAsFavorite
 * @param {String} repoName 
 * @param {String} language 
 * @param {String} tag 
 */
const addRepoAsFavorite = (repoName, language, tag) => {
  const found = favoriteRepoList.find((element) => {
    return element === repoName;
  });
  if (found) {
    showToastMessage("Already a Favorite repo!", false);
    return;
  }

  request(PUT_REQUEST,
    `${GITHUB_STARRED_API_URL}${repoName}`,
    success = (response) => {
      favoriteRepoList.push(repoName);
      addRepoToFavoriteList(repoName, language, tag);
      showToastMessage("Added to Favorites!");
    },
    error = () => {
      showToastMessage("Failed to add to Favorites!", false);
    });

}

/**
 * @function removeRepoFromFavorite
 * @param {String} repoName 
 * @param {String} language 
 * @param {String} tag 
 */
const removeRepoFromFavorite = (repoName, language, tag) => {

  request(DELETE_REQUEST,
    `${GITHUB_STARRED_API_URL}${repoName}`,
    success = (response) => {
      favoriteRepoList = favoriteRepoList.filter(e => e !== repoName);
      const favRepoId = repoName.replace('/', '');
      $(`#${favRepoId}`).remove();
      showToastMessage("Removed From Favorites!");
      const repoId = "repo-" + repoName.replace('/', '');
      $(`#${repoId} td:last-child`).remove();
      $(`#${repoId}`).append(addButton(repoName, language, tag));
    },
    error = () => {
      showToastMessage("Failed to remove from Favorites!", false);
    });
}

/**
 * @function getFavoriteRepos
 */
const getFavoriteRepos = () => {
  request(GET_REQUEST,
    STARRED_REPO_API_URL,
    success = (response) => {
      addReposToDOM(response, addRepoToFavoriteList);
      response.forEach(element => {
        favoriteRepoList.push(element.full_name);
      });
    },
    error = () => {
      showToastMessage("Failed to fetch Favorite repos!", false);
    });
}

getFavoriteRepos();

/**
 * @function showToastMessage
 * @param {String} message 
 * @param {Boolean} success 
 */
const showToastMessage = (message, success = true) => {

  $("#snackbar").html(message);

  let backgroundClass = success ? 'success' : 'failure';

  // Add the "show" class to div
  $("#snackbar").addClass('show');
  $("#snackbar").addClass(backgroundClass);

  // After 3 seconds, remove the show class from div
  setTimeout(() => {
    $("#snackbar").removeClass("show");
    $("#snackbar").removeClass(backgroundClass);
  }, 3000);
}
