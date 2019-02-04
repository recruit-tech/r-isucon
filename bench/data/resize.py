import os
import os.path
import sys


def main():
    d = sys.argv[1]
    os.makedirs(os.path.join(d, "dx", "300", "dy", "300"), exist_ok=True)
    os.makedirs(os.path.join(d, "dx", "50", "dy", "50"), exist_ok=True)
    os.makedirs(os.path.join(d, "dx", "25", "dy", "25"), exist_ok=True)
    for p in os.listdir(d):
        os.system("convert {} -resize 300x300 {}".format(os.path.join(d, p), os.path.join(d, "dx", "300", "dy", "300", p)))
        os.system("convert {} -resize 50x50 {}".format(os.path.join(d, p), os.path.join(d, "dx", "50", "dy", "50", p)))
        os.system("convert {} -resize 25x25 {}".format(os.path.join(d, p), os.path.join(d, "dx", "25", "dy", "25", p)))

    p = "default.png"
    os.system("convert {} -resize 300x300 {}".format(p, os.path.join(d, "dx", "300", "dy", "300", p)))
    os.system("convert {} -resize 50x50 {}".format(p, os.path.join(d, "dx", "50", "dy", "50", p)))
    os.system("convert {} -resize 25x25 {}".format(p, os.path.join(d, "dx", "25", "dy", "25", p)))



if __name__ == "__main__":
    main()
