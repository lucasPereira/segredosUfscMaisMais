var app = angular.module( 'Application',['facebook']).config([
    'FacebookProvider',
    function( FacebookProvider )
    {
	    FacebookProvider.setSdkVersion('v2.2');
	    FacebookProvider.setAppId('1458276754417230');
    }
]);

app.controller( 'MainController',['$scope','Facebook',function( $scope,Facebook )
{
	$scope.posts	= [];
	$scope.page		= '1427046280887158';
	$scope.url 		= '/'+$scope.page+'/feed?fields=comments,message,likes&access_token=1458276754417230|0991b0f73b131b6ff9e6533a50c313e0';
	$scope.eve 		= function()
	{
		Facebook.api( $scope.url, function( response )
		{
			$scope.$apply( function()
			{
				angular.forEach( response.data,function( value, key )
				{
					value.id = value.id.split("_")[1];
					$scope.posts.push( value );
				});
				$scope.url		= response.paging.next;
			});
		});
	};

	$scope.$watch( 'url',function()
	{
        $scope.eve();
	},true);
}]);


app.filter( 'cutMessage', function () {
    return function (value, wordwise, max, tail) {

        if (!value) return '';

        if( value.length > 350 )
        {
			value = value.substr( 0, 350 ) + ' ..."';
        }

        return value;
    };
})