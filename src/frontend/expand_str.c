#include <unistd.h>

void expand_str(char *str)
{
    int i = 0;
    while (str[i] == '\t' || str[i] == ' ')
        i++;
    while (str[i] != '\0')
    {
        while (str[i] != '\t' && str[i] != ' ' && str[i] != '\0')
        {
            write(1, &str[i], 1);
            i++;
        }
        if (str[i] == '\t' || str[i] == ' ')
            while (str[i] == '\t' || str[i] == ' ')
                i++;
        if (str[i] != '\0')
            write(1, "   ", 3);
    }
}

int main(int argc, char *argv[])
{
    if (argc != 2)
    {
        return 0;
    }
    expand_str(argv[1]);
    return 0;
}