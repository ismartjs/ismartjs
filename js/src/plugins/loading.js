(function () {
	Smart.extend(Smart.prototype, {
		loading: function () {
			var deferred = $.Deferred();
			var dialog = Smart.UI.template("loading");
			$(dialog).modal({
				keyboard: false,
				backdrop: false
			});
			deferred.done(function () {
				dialog.modal('hide')
			})
			return deferred;
		}
	});
})();