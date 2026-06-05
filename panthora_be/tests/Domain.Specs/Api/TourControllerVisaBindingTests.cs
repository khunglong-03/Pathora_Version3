using System.Reflection;
using global::Application.Features.Tour.Queries;
using global::Api.Controllers;
using Contracts.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Domain.Specs.Api;

public sealed class TourControllerVisaBindingTests
{
    [Theory]
    [InlineData(nameof(TourController.Create))]
    [InlineData(nameof(TourController.Update))]
    public void MultipartTourEndpoint_ShouldBindIsVisaFromForm(string actionName)
    {
        var method = typeof(TourController)
            .GetMethods(BindingFlags.Instance | BindingFlags.Public)
            .Single(m => m.Name == actionName);

        var parameter = method.GetParameters()
            .SingleOrDefault(p => p.Name == "isVisa");

        Assert.NotNull(parameter);
        Assert.Equal(typeof(bool), parameter.ParameterType);
        Assert.Equal(false, parameter.DefaultValue);
        Assert.NotNull(parameter.GetCustomAttribute<FromFormAttribute>());
    }

    [Fact]
    public void TourOperatorTourQueries_ShouldNotCacheEditableTourViews()
    {
        Assert.False(typeof(ICacheable).IsAssignableFrom(typeof(GetTourDetailQuery)));
        Assert.False(typeof(ICacheable).IsAssignableFrom(typeof(GetMyToursQuery)));
    }
}
