namespace Assistant.Validations;
using FluentValidation;
using Assistant.Controllers;

public class RegisterValidator:AbstractValidator<RegisterDto>
{
    public RegisterValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email không được để trống!")
            .EmailAddress().WithMessage("Email không đúng định dạng hợp lệ!")
            .MaximumLength(150).WithMessage("Email dài tối đa 150 ký tự thôi!");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Mật khẩu không được để trống!")
            .MinimumLength(8).WithMessage("Mật khẩu phải có ít nhất 8 ký tự!")
            .Matches("[A-Z]").WithMessage("Mật khẩu phải chứa ít nhất 1 chữ cái in hoa (A-Z)!")
            .Matches("[a-z]").WithMessage("Mật khẩu phải chứa ít nhất 1 chữ cái thường (a-z)!")
            .Matches("[0-9]").WithMessage("Mật khẩu phải chứa ít nhất 1 chữ số (0-9)!")
            .Matches("[^a-zA-Z0-9]").WithMessage("Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt (VD: @, #, $,...)!");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Tên không được để trống!")
            .Length(2, 100).WithMessage("Tên phải từ 2 đến 100 ký tự!")
            .Matches(@"^[\p{L}\s]+$").WithMessage("Tên người dùng chỉ được chứa chữ cái và khoảng trắng!");
    }
}
