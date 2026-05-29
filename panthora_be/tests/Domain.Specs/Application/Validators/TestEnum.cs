using FluentValidation;
using Domain.Enums;
public class TestEnumValidator : AbstractValidator<int>
{
    public TestEnumValidator()
    {
        RuleFor(x => x).IsInEnum();
    }
}
